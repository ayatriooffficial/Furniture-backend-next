const ImgGridDB = require("../../model/ImgGrid");

// POST: '/api/gridImg'  - homepageRoutes.js
exports.createImgGrid = async (req, res) => {
    try {
        const imageUrl = req.files
            .filter((file) => file.fieldname === "image")
            .map((file) => file.location);

        const { category, ...circles } = req.body;

        const convertToSchemaType = (inputData) => {
            const result = { circles: [] };

            for (const key in inputData) {
                if (inputData.hasOwnProperty(key)) {
                    const match = key.match(/^circles\[(\d+)\]\.(\w+)$/);
                    if (match) {
                        const index = parseInt(match[1]);
                        const field = match[2];

                        if (!result.circles[index]) {
                            result.circles[index] = {};
                        }

                        result.circles[index][field] =
                            field === "productPrice"
                                ? Number(inputData[key])
                                : inputData[key];
                    }
                }
            }

            return result;
        };
        const formattedCircles = convertToSchemaType(circles);

        const imgGridInstance = new ImgGridDB({
            imgSrc: imageUrl.join(""),
            circles: formattedCircles,
            category,
        });

        await imgGridInstance.save();
        res.status(201).json({ message: "Image grid created successfully!..." });
    } catch (error) {
        res.status(500).json(error);
    }
};

// GET: '/api/gridImg'  - homepageRoutes.js
exports.getImgGrid = async (req, res) => {
    try {
        const imgGrid = await ImgGridDB.find();
        res.status(200).json(imgGrid);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE: '/api/gridImg/:imgGridId'  - homepageRoutes.js
exports.deleteImgGrid = async (req, res) => {
    const imgGridId = req.params.imgGridId;

    try {
        const result = await ImgGridDB.findOneAndDelete({ _id: imgGridId });

        if (!result) {
            return res.status(404).json({ message: "image not found" });
        }

        // Fetch updated data after deletion
        const updatedData = await ImgGridDB.find();

        res.json(updatedData);
    } catch (error) {
        console.error("Error deleting img:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};