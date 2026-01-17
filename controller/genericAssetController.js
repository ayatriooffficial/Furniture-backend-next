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

function extractUrl(file) {
  if (!file) return null;
  // Cloudinary returns URL in 'path' property
  const url = file.path || file.secure_url || file.location || file.url || null;
  console.log("📸 Extracted URL from file:", {
    path: file.path,
    secure_url: file.secure_url,
    location: file.location,
    url: file.url,
    extracted: url,
  });
  return url;
}

function extractUrls(files) {
  if (!files) return [];
  if (!Array.isArray(files)) files = [files];
  return files.map(extractUrl).filter(Boolean);
}

// Generic upload for any mongoose model/document
// POST /admin/doc/:model/:id/upload
async function uploadForDoc(req, res) {
  try {
    const { model, id } = req.params;
    // Handle both FormData (multipart) and JSON body
    const field = req.body?.field || req.body?.field;
    const filterKey = req.body?.filterKey || req.body?.filterKey;
    const filterValue = req.body?.filterValue || req.body?.filterValue;
    const replaceIndex = req.body?.replaceIndex || req.body?.replaceIndex;
    const replaceIndices = req.body?.replaceIndices
      ? JSON.parse(req.body.replaceIndices)
      : [];
    const colorIndex =
      req.body?.colorIndex !== undefined
        ? parseInt(req.body.colorIndex)
        : undefined;

    console.log("📤 Upload request:", {
      model,
      id,
      field,
      filterKey,
      filterValue,
      replaceIndex,
      replaceIndices,
      colorIndex,
    });
    console.log("   req.body:", req.body);
    console.log("   req.files count:", req.files?.length || 0);

    if (!model || !id || !field)
      return res.status(400).json({
        error: "model, id and field are required",
        received: { model, id, field },
      });

    if (!mongoose.modelNames().includes(model))
      return res.status(400).json({ error: "Unknown model" });
    const Model = mongoose.model(model);
    const doc = await Model.findById(id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    let urls = extractUrls(req.files || (req.file ? [req.file] : []));

    // If no multipart files were uploaded, allow the client to pass image URLs
    // directly in the request body (useful when the admin UI uploads to
    // Cloudinary from the browser and only sends the resulting URLs).
    if (!urls.length) {
      const maybeUrls =
        req.body?.urls || req.body?.images || req.body?.image || req.body?.url;

      if (maybeUrls) {
        try {
          if (typeof maybeUrls === "string") {
            // try JSON array or comma-separated string
            if (maybeUrls.trim().startsWith("[")) {
              urls = JSON.parse(maybeUrls);
            } else if (maybeUrls.includes(",")) {
              urls = maybeUrls
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            } else {
              urls = [maybeUrls.trim()];
            }
          } else if (Array.isArray(maybeUrls)) {
            urls = maybeUrls.filter(Boolean);
          }
        } catch (e) {
          console.warn("Failed to parse body image urls", e);
        }
      }
    }

    if (!urls.length)
      return res.status(500).json({ error: "No uploaded files found" });

    const val = getNested(doc, field);
    console.log(" Target field inspection:", {
      field,
      valueType: typeof val,
      isArray: Array.isArray(val),
    });

    if (colorIndex !== undefined && Array.isArray(val) && val[colorIndex]) {
      console.log(` Handling color variant at index ${colorIndex}`);
      const colorVariant = val[colorIndex];

      if (Array.isArray(colorVariant.images)) {
        const cur = colorVariant.images || [];

        if (replaceIndices && replaceIndices.length > 0) {
          for (let i = 0; i < urls.length; i++) {
            const idx = replaceIndices[i];
            if (idx !== undefined && !isNaN(parseInt(idx))) {
              cur[parseInt(idx)] = urls[i];
              console.log(`  ↳ Replaced URL at index ${idx}`);
            } else {
              cur.push(urls[i]);
              console.log(`  ↳ Appended URL (no more replace indices)`);
            }
          }
        } else {
          // Append all URLs
          cur.push(...urls);
          console.log("  ↳ Pushed", urls.length, "URLs to color variant");
        }

        colorVariant.images = cur;
        val[colorIndex] = colorVariant;
        setNested(doc, field, val);
      }
      await doc.save();
      console.log(" Document saved successfully:", {
        model,
        id,
        field,
        colorIndex,
        urls,
      });
      return res.json({ success: true, urls, model, id, field, colorIndex });
    }

    if (Array.isArray(val)) {
      if (val.length === 0 || typeof val[0] === "string") {
        const cur = val || [];
        if (replaceIndices && replaceIndices.length > 0) {
          // Replace at specified indices
          for (let i = 0; i < urls.length; i++) {
            const idx = replaceIndices[i];
            if (idx !== undefined && !isNaN(parseInt(idx))) {
              cur[parseInt(idx)] = urls[i];
              console.log(`  ↳ Replaced URL at index ${idx}`);
            } else {
              // If we run out of replace indices, append the rest
              cur.push(urls[i]);
              console.log(`  ↳ Appended URL (no more replace indices)`);
            }
          }
        } else if (
          replaceIndex !== undefined &&
          !isNaN(parseInt(replaceIndex))
        ) {
          // Single replacement (legacy support)
          cur[parseInt(replaceIndex)] = urls[0];
          console.log("  ↳ Replaced URL at index", parseInt(replaceIndex));
        } else {
          // Append all URLs
          cur.push(...urls);
          console.log("  ↳ Pushed", urls.length, "URLs to array");
        }
        setNested(doc, field, cur);
      } else {
        if (!filterKey || !filterValue)
          return res.status(400).json({
            error:
              "filterKey and filterValue required for array-of-objects fields",
          });
        const arr = val;
        const el = arr.find(
          (e) => String(e[filterKey]) === String(filterValue)
        );
        if (!el)
          return res.status(404).json({ error: "Matching element not found" });
        if (Array.isArray(el.images)) {
          if (replaceIndex !== undefined && !isNaN(parseInt(replaceIndex))) {
            el.images[parseInt(replaceIndex)] = urls[0];
          } else {
            el.images.push(...urls);
          }
        } else {
          // fallback: set specified nested path 'field.images'
          // set field + '.images' if exists
          const imagesPath = field + ".images";
          const imagesVal = getNested(doc, imagesPath);
          if (Array.isArray(imagesVal)) {
            if (replaceIndex !== undefined && !isNaN(parseInt(replaceIndex)))
              imagesVal[parseInt(replaceIndex)] = urls[0];
            else imagesVal.push(...urls);
            setNested(doc, imagesPath, imagesVal);
          } else {
            // set an image property if exists
            if (typeof el.image === "string" || el.image === undefined)
              el.image = urls[0];
          }
        }
        setNested(doc, field, arr);
      }
    } else if (typeof val === "string" || val === undefined) {
      // single string field
      setNested(doc, field, urls[0]);
    } else if (typeof val === "object") {
      // object field - try to set image property
      if (typeof val.image === "string" || val.image === undefined) {
        val.image = urls[0];
        setNested(doc, field, val);
      } else {
        return res
          .status(400)
          .json({ error: "Unsupported target field shape" });
      }
    } else {
      return res.status(400).json({ error: "Unsupported target field type" });
    }

    await doc.save();
    console.log(" Document saved successfully:", { model, id, field, urls });
    return res.json({ success: true, urls, model, id, field });
  } catch (err) {
    console.error("generic upload error", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { uploadForDoc };
