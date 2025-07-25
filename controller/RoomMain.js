//model is not imported
const Room = require("../model/room");
const RoomMain = require("../model/RoomMain");
const Product = require("../model/Products");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const UserDB = require("../model/User");
const { v4: uuidv4 } = require('uuid');
// Update the create function to include FAQs and Features

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
async function uploadToS3(buffer, fileName, mimeType = "image/jpeg") {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `features/${fileName}`,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3.send(command);

  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/features/${fileName}`;
}
exports.create = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(406).send("Please provide product data");
    }
    //console.log("Request body:", req.body); // Debug log

    const {
      heading,
      summary,
      shortSummary,
      fiveRooms,
      fiveGridHeader,
      fiveGridDescription,
      twoRooms,
      twoGridHeader,
      twoGridDescription,
      firstSlider,
      secondSlider,
      thirdSlider,
      forthSlider,
      fifthSlider,
      metadataTitle,
      mainImage,
      roomType,
      faqs,
      features,
      position,
      authorId,
      featureName, // added from here
      featureDescription,
      featureType,
      tip,
      cards
    } = req.body;

    if (req.files && req.files.featuresIcons) {
      const iconsArray = Array.isArray(req.files.featuresIcons)
        ? req.files.featuresIcons
        : [req.files.featuresIcons];

      for (let i = 0; i < parsedFeatures.length; i++) {
        const iconFile = iconsArray[i];
        if (iconFile && iconFile.buffer) {
          const ext = iconFile.originalname.split(".").pop();
          const fileName = `${uuidv4()}.${ext}`;
          const imageUrl = await uploadToS3(
            iconFile.buffer,
            fileName,
            iconFile.mimetype
          );
          parsedFeatures[i].icon = imageUrl;
        } else {
          parsedFeatures[i].icon = "";
        }
      }
    }

    if (authorId) {
      const validAuthor = await UserDB.findById(authorId);
      if (!validAuthor) {
        return res.status(404).json({ message: "Author not found" });
      }
    }
    
    // Validate rooms and grids
    const fiveGridRooms = [];
    for (let data of fiveRooms) {
      const room = await Room.findById(data);
      if (room) {
        fiveGridRooms.push(room._id);
      } else {
        return res.status(404).json({ message: "Room not found in fiveRooms" });
      }
    }

    const twoGridRooms = [];
    for (let data of twoRooms) {
      const room = await Room.findById(data);
      if (room) {
        twoGridRooms.push(room._id);
      } else {
        return res.status(404).json({ message: "Room not found in twoRooms" });
      }
    }

    const mappedFiveGrid = {
      fiveGridHeader,
      fiveGridDescription,
      fiveGridRooms,
    };

    const mappedTwoGrid = {
      twoGridHeader,
      twoGridDescription,
      twoGridRooms,
    };

    // Validate mainImage
    const validMainRoom = await Room.findById(mainImage);
    if (!validMainRoom) {
      return res.status(404).json({ message: "Room not found in mainRoom" });
    }

    const validateSlider = (slider) => {
      //console.log(slider);

      if (!slider) {
        throw new Error("Invalid slider data");
      }
      if (!slider.type) {
        throw new Error("Invalid slider data: Ensure 'type' is provided");
      }
      if (!slider.header || slider.header.trim() === "") {
        throw new Error("Invalid slider data: Ensure 'header' is provided");
      }
      if (!slider.description || slider.description.trim() === "") {
        throw new Error(
          "Invalid slider data: Ensure 'description' is provided"
        );
      }
      if (!slider.subType) {
        throw new Error("Invalid slider data: Ensure 'subType' is provided");
      }
    };

    validateSlider(firstSlider);
    validateSlider(secondSlider);
    validateSlider(thirdSlider);
    validateSlider(forthSlider);
    validateSlider(fifthSlider);

    // Map slider products
    const mapSliderProducts = async (slider) => {
      let sliderProducts = [];
      if (slider.type === "Offer") {
        sliderProducts = await Product.find({ offer: slider.subType }).select(
          "_id"
        );
      } else if (slider.type === "Category") {
        if (slider.subType2) {
          sliderProducts = await Product.find({
            category: slider.subType,
            subcategory: slider.subType2,
          }).select("_id");
        } else {
          sliderProducts = await Product.find({
            category: slider.subType,
          }).select("_id");
        }
      } else if (slider.type === "Demand Type") {
        sliderProducts = await Product.find({
          demandtype: slider.subType,
        }).select("_id");
      }
      return sliderProducts.map((product) => product._id);
    };

    const firstSliderProducts = await mapSliderProducts(firstSlider);
    const secondSliderProducts = await mapSliderProducts(secondSlider);
    const thirdSliderProducts = await mapSliderProducts(thirdSlider);
    const forthSliderProducts = await mapSliderProducts(forthSlider);
    const fifthSliderProducts = await mapSliderProducts(fifthSlider);

    const newRoom = new RoomMain({
      roomType,
      heading,
      summary,
      shortSummary,
      mainImage: validMainRoom._id,
      tip:tip,
      fiveGrid: mappedFiveGrid,
      twoGrid: mappedTwoGrid,
      sliders: {
        firstSlider: {
          header: firstSlider.header,
          description: firstSlider.description,
          descriptionLinks: firstSlider.descriptionLinks,
          products: firstSliderProducts,
        },
        secondSlider: {
          header: secondSlider.header,
          description: secondSlider.description,
          descriptionLinks: secondSlider.descriptionLinks,
          products: secondSliderProducts,
        },
        thirdSlider: {
          header: thirdSlider.header,
          description: thirdSlider.description,
          descriptionLinks: thirdSlider.descriptionLinks,
          products: thirdSliderProducts,
        },
        forthSlider: {
          header: forthSlider.header,
          description: forthSlider.description,
          descriptionLinks: forthSlider.descriptionLinks,
          products: forthSliderProducts,
        },
        fifthSlider: {
          header: fifthSlider.header,
          description: fifthSlider.description,
          descriptionLinks: fifthSlider.descriptionLinks,
          products: fifthSliderProducts,
        },
      },
      metadata: { title: metadataTitle },
      position,
      faqs: faqs || [], // Add FAQs
      features: features || [], // Add Features
      author: authorId || null,
    });

    await newRoom.save();
    //console.log("New Room Created:", newRoom);

    res.status(201).json({ message: "New Room created successfully!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: error.message || "Error while creating new Room!" });
  }
};

// Update getRoom function to populate FAQs and Features
exports.getRoom = async (req, res) => {
  const { roomType } = req.query;
  try {
    const room = await RoomMain.findOne({ roomType })
      .populate("mainImage")
      .populate("fiveGrid.fiveGridRooms")
      .populate("twoGrid.twoGridRooms")
      .populate("firstSlider")
      .populate("secondSlider")
      .populate("thirdSlider")
      .populate("forthSlider")
      .populate("fifthSlider")
      .populate("sliders.firstSlider.products")
      .populate("sliders.secondSlider.products")
      .populate("sliders.thirdSlider.products")
      .populate("sliders.forthSlider.products")
      .populate("sliders.fifthSlider.products")
      .populate("features")
      .populate("author");
    res.status(200).json(room);
  } catch (error) {
    res
      .status(500)
      .json({ err: error.message || "Error while fetching rooms!" });
  }
};

// Get all rooms
exports.getRooms = async (req, res) => {
  try {
    const rooms = await RoomMain.find()
      .populate("mainImage")
      .populate("fiveGrid.fiveGridRooms")
      .populate("twoGrid.twoGridRooms")
      .populate("sliders.firstSlider.products")
      .populate("sliders.secondSlider.products")
      .populate("sliders.thirdSlider.products")
      .populate("sliders.forthSlider.products")
      .populate("sliders.fifthSlider.products")
      .populate("author");
    res.status(200).json(rooms);
  } catch (error) {
    res
      .status(500)
      .json({ err: error.message || "Error while fetching all rooms!" });
  }
};

// Delete room by ID
exports.deleteRoomById = async (req, res) => {
  const { roomId } = req.params;
  try {
    const deletedRoom = await RoomMain.findByIdAndDelete(roomId);
    if (!deletedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ err: error.message || "Error while deleting room!" });
  }
};
