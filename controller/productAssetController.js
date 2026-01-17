const Product = require("../model/Products");
const cloudinary = require("cloudinary").v2;

function extractUrl(file) {
  if (!file) return null;
  return file.path || file.secure_url || file.location || file.url || null;
}

function extractUrlsFromFiles(files) {
  if (!files) return [];
  if (!Array.isArray(files)) files = [files];
  return files.map((f) => extractUrl(f)).filter(Boolean);
}

async function uploadProductAsset(req, res) {
  try {
    const { target, color, index, replaceIndex } = req.body || {};
    const productId = req.params.id;

    if (!productId)
      return res.status(400).json({ error: "Product id required" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const urls = extractUrlsFromFiles(
      req.files || (req.file ? [req.file] : [])
    );
    if (!urls.length)
      return res.status(500).json({ error: "Uploaded file URL(s) not found" });

    switch (target) {
      case "gallery": {
        if (!Array.isArray(product.images)) product.images = [];
        if (replaceIndex !== undefined && !isNaN(parseInt(replaceIndex))) {
          const i = parseInt(replaceIndex);
          product.images[i] = urls[0];
        } else {
          product.images.push(...urls);
        }
        break;
      }

      case "colorImage": {
        if (!color)
          return res
            .status(400)
            .json({ error: "color is required for colorImage" });
        if (!Array.isArray(product.productImages)) product.productImages = [];
        const block = product.productImages.find(
          (p) => String(p.color).toLowerCase() === String(color).toLowerCase()
        );
        if (!block) {
          product.productImages.push({ color, images: [url] });
        } else {
          if (replaceIndex !== undefined && !isNaN(parseInt(replaceIndex))) {
            const i = parseInt(replaceIndex);
            block.images[i] = urls[0];
          } else {
            block.images.push(...urls);
          }
        }
        break;
      }

      case "coreValue": {
        const idx = parseInt(index);
        if (isNaN(idx))
          return res
            .status(400)
            .json({ error: "index is required for coreValue" });
        if (!Array.isArray(product.coreValues)) product.coreValues = [];
        while (product.coreValues.length <= idx) product.coreValues.push({});
        // set to first uploaded file's url
        product.coreValues[idx].image = urls[0];
        break;
      }

      case "feature": {
        const idx = parseInt(index);
        if (isNaN(idx))
          return res
            .status(400)
            .json({ error: "index is required for feature" });
        if (!Array.isArray(product.features)) product.features = [];
        while (product.features.length <= idx) product.features.push({});
        product.features[idx].image = urls[0];
        break;
      }

      case "pdf": {
        product.pdf = urls[0];
        break;
      }

      default:
        return res.status(400).json({ error: "Invalid target" });
    }

    await product.save();

    return res.json({ success: true, urls, productId });
  } catch (err) {
    console.error("uploadProductAsset error", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { uploadProductAsset };
