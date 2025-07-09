const HeaderInfoDB = require("../../model/Header");

// POST: '/api/createHeaderInfoSection'  - homepageRoutes.js
exports.createHeaderInfoSection = async (req, res) => {
  const imageUrls = req.files
    .filter((file) => file.fieldname === "icon")
    .map((file) => file.location);
  const { title, description, link } = req.body;

  try {
    const headerInfo = new HeaderInfoDB({
      title,
      description,
      icon : imageUrls[0],
      link,
    });

    const result = await headerInfo.save();
    res.status(201).json({ message: "Header card created successfully" });
  } catch (error) {
    console.error("Error creating header section:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET: '/api/getHeaderInfoSection'  - homepageRoutes.js
exports.getHeaderInfoSection = async (req, res) => {
  try {
    const info = await HeaderInfoDB.find();
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE: '/deleteHeaderInfoSection/:headerId'  - homepageRoutes.js
exports.deleteHeaderInfoSection = async (req, res) => {
  const headerId = req.params.headerId;

  try {
    const result = await HeaderInfoDB.findOneAndDelete({ _id: headerId });

    if (!result) {
      return res.status(404).json({ message: "Header card not found" });
    }

    // Fetch updated data after deletion
    const updatedData = await HeaderInfoDB.find();

    res.json(updatedData);
  } catch (error) {
    console.error("Error deleting header section:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
