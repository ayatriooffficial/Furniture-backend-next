const ImgSchemaDB = require("../../model/ImgSection");
const posterSchemaDB = require("../../model/poster");
// POST: '/api/createImgSection'  - homepageRoutes.js

exports.createImgSection = async (req, res) => {
  try {
    const imageUrl = req.files
      .filter((file) => file.fieldname === "image")
      .map((file) => file.location);

    const { text } = req.body;

    const imageInfo = new ImgSchemaDB({
      img: imageUrl.join(""),
      text,
    });
    const imgSection = await imageInfo.save();

    res.status(201).json({ message: "Images Section added successfully! " });

    // console.log("imagesection added");
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("error in creating image");
  }
};

// GET: '/api/getImgSection'  - homepageRoutes.js
exports.getImgSection = async (req, res) => {
  try {
    const info = await ImgSchemaDB.find();
    res.status(200).json(info);
    // console.log("imagesection fetched");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST: '/api/deleteImgSection/:imgId'  - homepageRoutes.js
exports.deleteImgSection = async (req, res) => {
  const imgId = req.params.imgId;

  try {
    const result = await ImgSchemaDB.findOneAndDelete({ _id: imgId });

    if (!result) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Fetch updated data after deletion
    const updatedData = await ImgSchemaDB.find();
    // console.log("image deleted ssuccesfully");

    res.json(updatedData);
  } catch (error) {
    console.error("Error deleting images section:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//Banner

// POST: '/api/createPosterSection'  - homepageRoutes.js
exports.createPosterSection = async (req, res) => {
  try {
    const desktopImageUrl = req.files.desktopImgSrc[0].location;
    const mobileImageUrl = req.files.mobileImgSrc[0].location;
    const { text, link } = req.body;

    const posterInfo = new posterSchemaDB({
      desktopImgSrc: desktopImageUrl,
      mobileImgSrc: mobileImageUrl,
      text,
      link,
    });

    const posterSection = await posterInfo.save();

    res
      .status(201)
      .json({ message: "poster Section added successfully!", posterSection });
    // console.log("poster section added");
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("Error in creating poster section:", error);
  }
};

// GET: '/api/getPosterSection'  - homepageRoutes.js
exports.getPosterSection = async (req, res) => {
  try {
    const info = await posterSchemaDB.find();
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST: '/api/deletePosterSection/:imgId'  - homepageRoutes.js
exports.deletePosterSection = async (req, res) => {
  const posterId = req.params.posterId;

  try {
    const result = await posterSchemaDB.findOneAndDelete({ _id: posterId });

    if (!result) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Fetch updated data after deletion
    const updatedData = await posterSchemaDB.find();
    // console.log("image deleted ssuccesfully");

    res.json(updatedData);
  } catch (error) {
    console.error("Error deleting images section:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
