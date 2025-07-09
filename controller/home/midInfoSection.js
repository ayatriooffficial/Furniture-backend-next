const MidInfoSectionDB = require("../../model/MidSection");

// POST: '/api/createMidInfoSection'  - homepageRoutes.js
exports.createMidInfoSection = async (req, res) => {
  try {
    const info = await MidInfoSectionDB.create(req.body);
    res.status(201).json({ message: "Mid Section added successfully! " });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET: '/api/getMidInfoSection'  - homepageRoutes.js
exports.getMidInfoSection = async (req, res) => {
  try {
    const info = await MidInfoSectionDB.find();
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// DELETE: '/deleteMidSection/:midInfoId'  - homepageRoutes.js
exports.deleteMidInfoSection = async (req, res) => {
  const midInfoId = req.params.midInfoId;

  try {
    const result = await MidInfoSectionDB.findOneAndDelete({ _id: midInfoId });

    if (!result) {
      return res.status(404).json({ message: "Circle not found" });
    }

    // Fetch updated data after deletion
    const updatedData = await MidInfoSectionDB.find();

    res.json(updatedData);
  } catch (error) {
    console.error("Error deleting circle:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};