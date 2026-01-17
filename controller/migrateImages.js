const mongoose = require("mongoose");

function replaceInValue(value, replacements) {
  if (typeof value === "string") {
    let out = value;
    for (const { from, to } of replacements) {
      if (!from) continue;
      if (out.includes(from)) out = out.split(from).join(to);
    }
    return out;
  }
  if (Array.isArray(value)) {
    return value.map((v) => replaceInValue(v, replacements));
  }
  if (value && typeof value === "object") {
    const obj = value;
    for (const k of Object.keys(obj)) {
      obj[k] = replaceInValue(obj[k], replacements);
    }
    return obj;
  }
  return value;
}

async function migrate(req, res) {
  try {
    const {
      find,
      replace,
      mappings,
      dryRun = true,
      batchSize = 100,
    } = req.body || {};

    // build replacements array from input
    const replacements = [];
    if (Array.isArray(mappings)) {
      for (const m of mappings) {
        if (m.from && m.to) replacements.push({ from: m.from, to: m.to });
      }
    }
    if (find && replace) replacements.push({ from: find, to: replace });

    if (replacements.length === 0) {
      return res
        .status(400)
        .json({
          error:
            "No replacements provided. Supply `find`/`replace` or `mappings`.",
        });
    }

    const modelNames = mongoose.modelNames();
    const summary = {};

    for (const name of modelNames) {
      if (!name || name.startsWith("system")) continue;
      const Model = mongoose.model(name);
      let updated = 0;
      let examined = 0;

      const cursor = Model.find().cursor();
      const toSave = [];

      for (
        let doc = await cursor.next();
        doc != null;
        doc = await cursor.next()
      ) {
        examined++;
        const original = doc.toObject({ depopulate: true });
        const mutated = replaceInValue(
          JSON.parse(JSON.stringify(original)),
          replacements
        );

        // compare shallowly by JSON
        const origJson = JSON.stringify(original);
        const mutatedJson = JSON.stringify(mutated);
        if (origJson !== mutatedJson) {
          updated++;
          if (!dryRun) {
            // apply mutated values back to document and save
            // copy mutated fields onto doc
            for (const key of Object.keys(mutated)) {
              if (key === "_id") continue;
              doc.set(key, mutated[key]);
            }
            toSave.push(doc.save());
          }
        }

        // flush batch
        if (toSave.length >= batchSize) {
          await Promise.all(toSave.splice(0));
        }
      }

      // finalize remaining saves
      if (!dryRun && toSave.length) await Promise.all(toSave);

      summary[name] = { examined, updated };
    }

    return res.json({ ok: true, dryRun: !!dryRun, replacements, summary });
  } catch (err) {
    console.error("migrateImages error", err);
    return res
      .status(500)
      .json({ error: "Migration failed", details: err.message });
  }
}

module.exports = { migrate };
