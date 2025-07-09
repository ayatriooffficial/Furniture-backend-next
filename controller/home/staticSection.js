const StaticSectionDb = require("../../model/staticSection");


// POST: '/api/createStaticSection'  - homepageRoutes.js
exports.createStaticSection = async (req, res) => {
    try {
      const { title, icon, desc,img } = req.body;
  
      const staticSection = new StaticSectionDb({
        title,
        icon,
        desc,
        img,
      });
  
      await staticSection.save();
  
      res.status(201).json({ message: "Static Section added successfully! " });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

// GET: '/api/getStaticSection'  - homepageRoutes.js
  exports.getStaticSection = async (req, res) => {
    try {
      const info = await StaticSectionDb.find();
      res.status(200).json(info);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  
// DELETE: '/api/deleteStaticSection/:staticId'  - homepageRoutes.js
  exports.deleteStaticSection = async (req, res) => {
    try {
      const staticId = req.params.staticId;
      const result = await StaticSectionDb.findOneAndDelete({ _id: staticId });
      if (!result) {
        return res.status(404).json({ message: "Image not found" });
      }
      const updatedData = await StaticSectionDb.find();
      res.json(updatedData);
    } catch (error) {
      console.error("Error deleting images section:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };