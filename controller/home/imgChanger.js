const imageChangerDB = require("../../model/imgchanger");

// POST: '/api/createImgChanger'  - homepageRoutes.js
exports.createImgChanger = async (req, res) => {

    try {
        const imageUrl = req.files
            .filter((file) => file.fieldname === "image")
            .map((file) => file.location);

        const { desc, title } = req.body;
        // console.log(req.body)
        const imageInfo = new imageChangerDB({
            img: imageUrl,
            desc,
            title,
        });
        const imgSection = await imageInfo.save();

        res.status(201).json({ message: "Images Section added successfully! " });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET: '/api/getImgChanger'  - homepageRoutes.js
exports.getImgChanger = async (req, res) => {
    try {
        const info = await imageChangerDB.find();
        res.status(200).json(info);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// DELETE: '/api/deleteImgChanger/:imgChangerId'  - homepageRoutes.js
exports.deleteImgChanger = async (req, res) => {
    try {
        const imgChangerId = req.params.imgChangerId;
        const result = await imageChangerDB.findOneAndDelete({ _id: imgChangerId });
        if (!result) {
            return res.status(404).json({ message: "Image not found" });
        }
        const updatedData = await imageChangerDB.find();
        res.json(updatedData);
    } catch (error) {
        console.error("Error deleting images section:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};