/**
 * Controller to clean up old S3 URLs from image fields
 */

const mongoose = require("mongoose");

function getNested(obj, path) {
  return path.split(".").reduce((o, p) => (o ? o[p] : undefined), obj);
}

function setNested(obj, path, value) {
  const parts = path.split(".");
  const last = parts.pop();
  let cur = obj;
  for (const p of parts) {
    if (!cur[p]) cur[p] = {};
    cur = cur[p];
  }
  cur[last] = value;
}

async function cleanupOldUrls(req, res) {
  try {
    const { model, id, field } = req.params;

    if (!model || !id || !field) {
      return res.status(400).json({
        error: "model, id, and field are required",
      });
    }

    if (!mongoose.modelNames().includes(model)) {
      return res.status(400).json({ error: "Unknown model" });
    }

    const Model = mongoose.model(model);
    const doc = await Model.findById(id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const val = getNested(doc, field);
    if (!Array.isArray(val)) {
      return res.status(400).json({
        error: "Field is not an array",
      });
    }

    console.log(` Cleanup old URLs from ${model}.${field}`);
    console.log(`   Before: ${val.length} URLs`);

    // Separate S3 and Cloudinary URLs
    const s3Urls = [];
    const cloudinaryUrls = [];

    val.forEach((url, idx) => {
      if (url && typeof url === "string") {
        if (
          url.includes("s3.ap-south-1.amazonaws.com") ||
          url.includes("s3.amazonaws.com")
        ) {
          s3Urls.push({ idx, url });
          console.log(`   S3 URL at [${idx}]: ${url.substring(0, 60)}...`);
        } else if (url.includes("res.cloudinary.com")) {
          cloudinaryUrls.push(url);
          console.log(
            `     Cloudinary URL at [${idx}]: ${url.substring(0, 60)}...`
          );
        } else {
          cloudinaryUrls.push(url); // Keep unknown URLs
        }
      }
    });

    // Replace with only Cloudinary URLs
    setNested(doc, field, cloudinaryUrls);
    await doc.save();

    console.log(
      `   After: ${cloudinaryUrls.length} URLs (removed ${s3Urls.length} old S3 URLs)`
    );

    return res.json({
      success: true,
      message: `Cleaned up old URLs from ${field}`,
      stats: {
        totalBefore: val.length,
        totalAfter: cloudinaryUrls.length,
        s3UrlsRemoved: s3Urls.length,
        cloudinaryUrlsKept: cloudinaryUrls.length,
      },
      removed: s3Urls.map((u) => u.url),
    });
  } catch (err) {
    console.error("cleanup error", err);
    return res.status(500).json({ error: err.message });
  }
}

async function cleanupPattern(req, res) {
  try {
    const { pattern } = req.body;
    if (!pattern) {
      return res.status(400).json({ error: "pattern is required" });
    }

    let totalCleaned = 0;
    let modelsProcessed = 0;

    console.log(`🧹 Cleaning up URLs matching pattern: "${pattern}"`);

    // Get all models
    const modelNames = mongoose.modelNames();

    for (const modelName of modelNames) {
      try {
        const Model = mongoose.model(modelName);
        const schema = Model.schema;
        const imagePaths = [];

  
        Object.keys(schema.paths).forEach((path) => {
          const pathType = schema.paths[path];
          if (
            pathType.instance === "Array" &&
            pathType.caster?.instance === "String"
          ) {
            imagePaths.push(path);
          }
        });

        if (imagePaths.length === 0) continue;

        modelsProcessed++;

        // Update all documents
        for (const path of imagePaths) {
          const docs = await Model.find({});

          for (const doc of docs) {
            const val = getNested(doc, path);
            if (Array.isArray(val)) {
              const filtered = val.filter(
                (url) =>
                  !url || typeof url !== "string" || !url.includes(pattern)
              );

              if (filtered.length < val.length) {
                setNested(doc, path, filtered);
                await doc.save();
                totalCleaned += val.length - filtered.length;
              }
            }
          }
        }
      } catch (e) {
        // Skip models with errors
        console.error(`  Error processing ${modelName}:`, e.message);
      }
    }

    return res.json({
      success: true,
      message: `Cleaned up all URLs matching pattern: "${pattern}"`,
      stats: {
        modelsProcessed,
        totalUrlsRemoved: totalCleaned,
      },
    });
  } catch (err) {
    console.error("pattern cleanup error", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { cleanupOldUrls, cleanupPattern };
