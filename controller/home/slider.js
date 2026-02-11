const SliderDB = require("../../model/Slider");

// POST:  '/api/createImgCricle' -  homepageRoutes.js
exports.createImgCircle = async (req, res) => {
  try {
    const desktopImageUrl = req.files.desktopImgSrc[0].location;
    const mobileImageUrl = req.files.mobileImgSrc[0].location;
    const { imgTitle, ...circles } = req.body;
    let url;
    if (req.body.category && req.body.demandtype) {
      url = `${req.body.category}/collection/all?demandtype=${req.body.demandtype}`;
    }
    if (req.body.category && req.body.offer) {
      url = `${req.body.category}/collection/all?offer=${req.body.offer
        .replace(/%/g, "percent")
        .replace(/ /g, "-")}`;
    }

    // if mobileSlide then set mobileSlide to true

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

    const sliderInstance = new SliderDB({
      desktopImgSrc: desktopImageUrl,
      mobileImgSrc: mobileImageUrl,
      link: url,
      imgTitle: imgTitle,
      circles: formattedCircles.circles,
    });

    await sliderInstance.save();
    res.status(201).json({ message: "Slider created successfully!..." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET:  '/api/getImgCircle' -  homepageRoutes.js
exports.getSliderCircle = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const lastIndex = page * limit;
  try {
    const sliders = await SliderDB.find().sort({ createdAt: -1 });
    const length = sliders.length;
    let result = sliders.slice(skip, lastIndex);
    res.set({
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'ETag': `"slider-v1-${length}"`,
      'Vary': 'Accept-Encoding'
    });
    
    res.status(200).json({ result, length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSliderCircle = async (req, res) => {
  const circleId = req.params.circleId;

  try {
    const result = await SliderDB.findOneAndDelete({ _id: circleId });

    if (!result) {
      return res.status(404).json({ message: "Circle not found" });
    }

    // Fetch updated data after deletion
    const updatedData = await SliderDB.find();

    res.json(updatedData);
  } catch (error) {
    console.error("Error deleting circle:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
