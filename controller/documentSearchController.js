const mongoose = require("mongoose");

const SEARCH_FIELD_PATTERNS = [
  "title",
  "name",
  "productTitle",
  "productName",
  "categoryName",
  "roomName",
  "description",
  "firstName",
  "lastName",
  "email",
  "slug",
  "displayName",
  "userName",
  "label",
  "heading",
  "patternNumber", // Product pattern/SKU
  "productId", // Product ID
  "sku", // Stock keeping unit
  "code", // Product code
];

function findSearchableFields(schemaObj, prefix = "") {
  const fields = [];

  if (!schemaObj || typeof schemaObj !== "object") {
    return fields;
  }

  for (const [key, value] of Object.entries(schemaObj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    const keyLower = key.toLowerCase();
    const isSearchField = SEARCH_FIELD_PATTERNS.some((pattern) =>
      keyLower.includes(pattern.toLowerCase())
    );

    if (isSearchField) {
      if (value === String || value?.type === String) {
        fields.push(path);
      } else if (Array.isArray(value) && value[0] === String) {
        // Array of strings
        fields.push(path);
      } else if (
        value?.type &&
        (value.type === String ||
          (Array.isArray(value.type) && value.type[0] === String))
      ) {
        fields.push(path);
      }
    }

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      prefix.split(".").length < 3
    ) {
      if (
        value.type &&
        typeof value.type === "object" &&
        !Array.isArray(value.type)
      ) {
        fields.push(...findSearchableFields(value.type, path));
      } else if (!value.type && value !== String) {
        fields.push(...findSearchableFields(value, path));
      }
    }
  }

  return fields;
}

async function searchDocuments(req, res) {
  try {
    const { model } = req.params;
    const { q, field } = req.query;

    if (!model || !q) {
      return res
        .status(400)
        .json({ error: "model and q (query) parameters required" });
    }

    if (!mongoose.modelNames().includes(model)) {
      return res.status(400).json({ error: "Unknown model" });
    }

    const Model = mongoose.model(model);

    let searchFields = [];
    if (field) {
      searchFields = [field];
    } else {
      searchFields = findSearchableFields(Model.schema.tree);
    }

    console.log(
      `[SEARCH] Model: ${model}, Field: ${field || "all"}, Query: "${q}"`
    );

    if (searchFields.length === 0) {
      return res.json({
        ok: true,
        model,
        query: q,
        field: field || "all",
        results: [],
        count: 0,
        message: `No searchable fields found`,
      });
    }

    const regex = new RegExp(q, "i");

    const conditions = searchFields.map((f) => ({
      [f]: { $regex: regex },
    }));

    console.log(`[SEARCH] Searching in fields: [${searchFields.join(", ")}]`);

    const results = await Model.find({ $or: conditions }).limit(10).lean();

    console.log(`[SEARCH] Found ${results.length} results`);

    // Map results to consistent format - use first matching field
    const formattedResults = results.map((doc) => {
      let displayName = "Untitled";

      // Try each search field in order
      for (const f of searchFields) {
        const value = getNestedValue(doc, f);
        if (value && typeof value === "string" && value.trim()) {
          displayName = value;
          break;
        }
      }

      return {
        _id: doc._id,
        name: displayName,
      };
    });

    return res.json({
      ok: true,
      model,
      query: q,
      field: field || "all",
      results: formattedResults,
      count: formattedResults.length,
      searchFields: searchFields,
    });
  } catch (err) {
    console.error("document search error", err);
    return res.status(500).json({ error: err.message });
  }
}

// Helper to get nested value from object
function getNestedValue(obj, path) {
  return path.split(".").reduce((o, p) => o?.[p], obj);
}

async function getDocumentById(req, res) {
  try {
    const { model, id } = req.params;

    if (!model || !id) {
      return res
        .status(400)
        .json({ error: "model and id parameters required" });
    }

    if (!mongoose.modelNames().includes(model)) {
      return res.status(400).json({ error: "Unknown model" });
    }

    const Model = mongoose.model(model);
    const doc = await Model.findById(id).lean();

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    console.log(`[GET DOC] Model: ${model}, ID: ${id}, Found: Yes`);

    return res.json({
      ok: true,
      model,
      id,
      doc: doc,
    });
  } catch (err) {
    console.error("get document error", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { searchDocuments, getDocumentById };
