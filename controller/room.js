const Room = require("../model/room");
const categoriesDB = require("../model/Category");
const productsDB = require("../model/Products");
const mongoose = require("mongoose")
// POST: api/createRoom
exports.createRoom = async (req, res) => {
 

  try {
     // Validate uploaded files
     if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).send("No files uploaded.");
    }
    //   // Extract image and PDF URLs from req.files
    const imageUrls = req.files
      .filter((file) => file.fieldname === "image")
      .map((file) => file.location);

    if (!req.body) {
      return res.status(406).send("Please provide room data");
    }

    const { productId, productObjectId, roomType, ...circles } = req.body;
   
    const alreadyAvailable = await Room.find({
      $and: [{ productId: productId }, { roomType: roomType }],
    });
    if (alreadyAvailable.length > 0) {
      return res.status(406).send("Room already exists for this product");
    }
const cleanedProductId = productId.trim();

// Query the database
const product = await productsDB.findOne({ productId: cleanedProductId });

    
    if (!product) {
      return res.status(404).send("Product not found");
    }
    console.log("Matched product:", product);
    const productCategory = product.category;

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

    // const product = await productsDB.findOne({ productId });

    const newRoom = new Room({
      imgSrc: imageUrls[0],
      children: formattedCircles.circles,
      roomType,
      productId,
      productObjectId,
      productCategory,
    });
    await newRoom.save();
    console.log(newRoom);
    res.status(201).json({ message: "New Room created successfully!...." });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ err: error.message || "Error while creating new Room!" });
  }
};

// GET: api/rooms
exports.getRooms = async (req, res) => {
  const { roomType } = req.params;

  try {
    let rooms;
    if (roomType) {
      rooms = await Room.find({ roomType });
    } else {
      rooms = await Room.find();
    }
    res.status(200).json(rooms);
  } catch (error) {
    res
      .status(500)
      .json({ err: error.message || "Error while fetching rooms!" });
  }
};

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res
      .status(500)
      .json({ err: error.message || "Error while fetching rooms!" });
  }
};

exports.getTabsRoom = async (req, res) => {
  try {
    const category = await categoriesDB
      .find()
      .select("name subcategories")
      .sort({ popularity: -1 });

    let rooms = [];

    if (category.length > 0) {
      for (let i = 0; i < category.length; i++) {
        const sub = category[i].subcategories.sort(
          (a, b) => b.popularity - a.popularity
        )[0];
        const product = await productsDB
          .findOne({
            category: category[i].name,
            subcategory: sub.name,
          })
          .select("productId")
          .sort({ popularity: -1 });
          
        if (product) {
          console.log(product.productId);
          const room = await Room.find({ productId: product.productId });
          if (room.length > 0) {
            rooms = [...rooms, ...room];
          }
        }
      }
    }
    res.status(200).json(rooms);
  } catch (error) {
    res
      .status(500)
      .json({ err: error.message || "Error while fetching rooms!" });
  }
};

exports.getRoomByQuery = async (req, res) => {
  try {
    const { category, roomType } = req.query;
    let room;
    if (category) {
      room = await Room.findOne({
        productCategory: { $regex: new RegExp(category, "i") },
      });
    } else if (roomType) {
      room = await Room.findOne({ roomType });
      return res.status(200).json(room);
    }
    if (!room) room = await Room.findOne();
    res.status(200).json(room);
  } catch (error) {
    res
      .status(500)
      .json({ err: error.message || "Error while fetching room!" });
  }
};

exports.getAllRoomsByCategory = async (req, res) => {
  const { productCategory } = req.params;
  try {
    const rooms = await Room.find({ productCategory });
    res.status(200).json(rooms);
  } catch (error) {
    res
      .status(500)
      .json({ err: error.message || "Error while fetching rooms!" });
  }
};

exports.getAllDifferentRoomTypes = async (req, res) => {
  try {
    const roomTypes = await Room.find().distinct("roomType");
    res.status(200).json(roomTypes);
  } catch (error) {
    res
      .status(500)
      .json({ err: error.message || "Error while fetching room types!" });
  }
};

exports.getAllCategoriesByRoomType = async (req, res) => {
  const { roomType } = req.params;

  try {
    const categories = await Room.find({
      roomType: { $regex: new RegExp(roomType, "i") },
    }).distinct("productCategory");
    res.status(200).json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ err: error.message || "Error while fetching categories!" });
  }
};

exports.getRoomsByCategoryAndType = async (req, res) => {
  const { roomType, productCategory } = req.query;

  try {
    const rooms = await Room.find({ roomType, productCategory });
    res.status(200).json(rooms);
  } catch (error) {
    res
      .status(500)
      .json({ err: error.message || "Error while fetching rooms!" });
  }
};

exports.addSpecialRoomInCategory = async (req, res) => {
  try {
    const { roomId, categoryName } = req.body;
    console.log(req.body);

    const category = await categoriesDB.findOne({ name: categoryName });
    if (!category) {
      return res.status(404).send("Category not found");
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).send("Room not found");
    }

    category.specialRoom = roomId;
    await category.save();
    res.status(200).json({ message: "Special Room added successfully!" });
  } catch (error) {
    s;
    res
      .status(500)
      .json({ err: error.message || "Error while adding special room!" });
  }
};

exports.getCategorySpecialRoom = async (req, res) => {
  const { categoryName } = req.params;
  try {
    const category = await categoriesDB
      .findOne({
        name: categoryName,
      })
      .populate("specialRoom");
    console.log(category);
    if (!category) {
      return res.status(404).send("Category not found");
    }
    res.status(200).json(category.specialRoom);
  } catch (error) {
    res
      .status(500)
      .json({ err: error.message || "Error while fetching special room!" });
  }
};

exports.getRoomIDByProductIDAndRoomType = async (req, res) => {
  const { productId, roomType } = req.query;
  try {
    const room = await Room.findOne({ productId, roomType });
    res.status(200).json(room?._id);
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ err: error.message || "Error while fetching room!" });
  }
};


exports.deleteRoomById = async (req, res) => {
  const { roomId } = req.params;

  try {
    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid Room ID format" });
    }
    const deletedRoom = await Room.findByIdAndDelete(roomId);
    if (!deletedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.status(200).json({ message: "Room deleted successfully", deletedRoom });
  } catch (error) {
    console.log(error);
    res.status(500).json({ err: error.message || "Error while deleting room!" });
  }
};
