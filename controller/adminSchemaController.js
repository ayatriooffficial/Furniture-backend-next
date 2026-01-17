const mongoose = require("mongoose");

function detectFieldType(node) {
  if (!node) return null;

  if (node === String || node.type === String) return "string";
  if (node === Number || node.type === Number) return "number";
  if (node === Boolean || node.type === Boolean) return "boolean";

  if (Array.isArray(node)) {
    const el = node[0];
    if (el === String || (el && el.type === String)) return "arrayString";
    if (el === Number || (el && el.type === Number)) return "arrayNumber";
    if (typeof el === "object" && el !== null) return "arrayObject";
    return "array";
  }

  if (node.type && Array.isArray(node.type)) {
    const el = node.type[0];
    if (el === String || (el && el.type === String)) return "arrayString";
    if (el === Number || (el && el.type === Number)) return "arrayNumber";
    if (typeof el === "object" && el !== null) return "arrayObject";
    return "array";
  }

  
  if (typeof node === "object") return "object";
  return null;
}

function isImageField(key) {
  const lname = key.toLowerCase();
  return (
    lname.includes("image") ||
    lname.includes("img") ||
    lname.includes("src") ||
    lname.includes("icon") ||
    lname.includes("pdf") ||
    lname.includes("photo") ||
    lname.includes("picture") ||
    lname.includes("url")
  );
}

function traverseSchemaTree(tree, prefix = "", depth = 0) {
  const results = [];
  const MAX_DEPTH = 5; 

  if (depth > MAX_DEPTH) return results;

  for (const key of Object.keys(tree)) {
    if (key === "_id" || key === "__v" || key === "versionKey") continue;

    const node = tree[key];
    const path = prefix ? `${prefix}.${key}` : key;

    if (isImageField(key)) {
      const type = detectFieldType(node);
      if (type) {
        results.push({ path, type });
      }
    }

    if (node && typeof node === "object") {
      if (node.type) {
        if (
          node.type === String ||
          node.type === Number ||
          node.type === Boolean
        ) {
          // Already handled above
        }
        // If type is an Array
        else if (Array.isArray(node.type)) {
          const el = node.type[0];
          // Handle [String], [Number], etc - already handled
          if (el === String || el === Number || el === Boolean) {
            // Skip
          }
          // Handle [{ nested: schema }]
          else if (el && typeof el === "object") {
            results.push(...traverseSchemaTree(el, path, depth + 1));
          }
        }
        else if (
          typeof node.type === "object" &&
          node.type.constructor.name === "Object"
        ) {
          results.push(...traverseSchemaTree(node.type, path, depth + 1));
        }
      }
      else if (Array.isArray(node)) {
        const el = node[0];
        if (el && typeof el === "object") {
          results.push(...traverseSchemaTree(el, path, depth + 1));
        }
      }
      else if (!Array.isArray(node)) {
        // Make sure it's not a native type being misidentified
        if (node.constructor && node.constructor.name === "Object") {
          results.push(...traverseSchemaTree(node, path, depth + 1));
        }
      }
    }
  }

  return results;
}

async function getImageFields(req, res) {
  try {
    const models = {};
    const modelNames = mongoose.modelNames();
    console.log("\n ========== IMAGE FIELD DETECTION START ==========");
    console.log(` Total registered models: ${modelNames.length}`);
    console.log(`Models: ${modelNames.sort().join(", ")}\n`);

    for (const name of modelNames) {
      try {
        const Model = mongoose.model(name);
        const tree = Model.schema.tree;

        const fields = traverseSchemaTree(tree);
        models[name] = fields && fields.length > 0 ? fields : [];

        if (fields && fields.length > 0) {
          console.log(` ${name.padEnd(20)}: ${fields.length} field(s)`);
          fields.forEach((f) => {
            console.log(`   └─ ${f.path.padEnd(35)} [${f.type}]`);
          });
        } else {
          console.log(`⚠️  ${name.padEnd(20)}: (no image fields)`);
        }
      } catch (e) {
        console.error(` ${name}: ${e.message}`);
        models[name] = [];
      }
    }
    const modelsWithImages = Object.entries(models)
      .filter(([_, fields]) => fields.length > 0)
      .sort(([a], [b]) => a.localeCompare(b));

    console.log(
      `Models with image fields: ${modelsWithImages.length}/${modelNames.length}\n`
    );
    modelsWithImages.forEach(([modelName, fields]) => {
      console.log(`${modelName}: ${fields.map((f) => f.path).join(", ")}`);
    });
    return res.json({ ok: true, models });
  } catch (err) {
    console.error(" getImageFields error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function debugModelImageFields(req, res) {
  try {
    const { model } = req.params;

    if (!mongoose.modelNames().includes(model)) {
      return res.status(400).json({
        error: `Model not found: ${model}`,
        available: mongoose.modelNames().sort(),
      });
    }

    const Model = mongoose.model(model);
    const tree = Model.schema.tree;
    const fields = traverseSchemaTree(tree);

    console.log(`Found ${fields.length} image fields:`, fields);

    return res.json({
      ok: true,
      model,
      schemaKeys: Object.keys(tree),
      imageFields: fields,
      count: fields.length,
    });
  } catch (err) {
    console.error(" Debug error:", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getImageFields, debugModelImageFields };
