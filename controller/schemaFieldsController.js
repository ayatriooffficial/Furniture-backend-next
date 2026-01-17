const mongoose = require("mongoose");

function getAllSearchableFields(schemaTree, prefix = "") {
  const fields = [];

  for (const [key, value] of Object.entries(schemaTree)) {
    const path = prefix ? `${prefix}.${key}` : key;

    // Check if it's a String field
    if (value === String || value?.type === String) {
      fields.push(path);
    } else if (Array.isArray(value) && value[0] === String) {
      fields.push(path);
    } else if (
      value?.type &&
      (value.type === String ||
        (Array.isArray(value.type) && value.type[0] === String))
    ) {
      fields.push(path);
    }

    // Recurse into nested objects (limit depth)
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      prefix.split(".").length < 2
    ) {
      if (
        value.type &&
        typeof value.type === "object" &&
        !Array.isArray(value.type)
      ) {
        fields.push(...getAllSearchableFields(value.type, path));
      } else if (!value.type && value !== String) {
        fields.push(...getAllSearchableFields(value, path));
      }
    }
  }

  return fields;
}

async function getSearchableFields(req, res) {
  try {
    const searchableFields = {};

    for (const name of mongoose.modelNames()) {
      try {
        const Model = mongoose.model(name);
        const tree = Model.schema.tree;
        const fields = getAllSearchableFields(tree);

        if (fields.length > 0) {
          searchableFields[name] = fields;
        }
      } catch (e) {
        // ignore per-model errors
        console.error(`Error processing model ${name}:`, e.message);
      }
    }

    console.log("✅ Searchable fields found:", Object.keys(searchableFields));
    return res.json({
      ok: true,
      searchableFields,
    });
  } catch (err) {
    console.error("getSearchableFields error", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getSearchableFields };
