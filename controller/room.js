const Room = require("../model/room");
const categoriesDB = require("../model/Category");
const productsDB = require("../model/Products");
const mongoose = require("mongoose");
const RoomTypeDB = require("../model/roomType");
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
      .map((file) => file.path || file.location);
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
    //console.log("Matched product:", product);
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
    //console.log(newRoom);
    res.status(201).json({ message: "New Room created successfully!...." });
  } catch (error) {
    //console.log(error.message);
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
      // Match roomType ignoring hyphen/space differences
      const match = { roomType: { $regex: new RegExp(`^${roomType.replace(/[-\s]+/g, "[-\\s]*")}$`, "i") } };
      rooms = await Room.find(match);
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
    const MAX_ROOMS_PER_TYPE = 8;
    const MAX_PRODUCTS_PER_SUBCATEGORY = 15; // cap before fetching rooms

    // ---------- Step 1: Categories -> sorted subcategories ----------
    const categories = await categoriesDB
      .find({})
      .select("name subcategories")
      .lean();

    const subcategories = [];
    for (const category of categories) {
      if (!category.subcategories?.length) continue;
      const sortedSubs = [...category.subcategories].sort(
        (a, b) => (b.popularity || 0) - (a.popularity || 0)
      );
      for (const sub of sortedSubs) {
        subcategories.push({
          category: category.name,
          subcategory: sub.name,
          popularity: sub.popularity || 0,
        });
      }
    }
    subcategories.sort((a, b) => b.popularity - a.popularity);

    // ---------- Step 2: Fetch products, then cap per subcategory ----------
    const products = await productsDB
      .find({
        $or: subcategories.map((sub) => ({
          category: sub.category,
          subcategory: sub.subcategory,
        })),
      })
      .select("productId category subcategory popularity")
      .sort({ popularity: -1 })
      .lean();

    if (!products.length) return res.status(200).json([]);

    const productMap = new Map();
    for (const product of products) {
      const key = `${product.category}__${product.subcategory}`;
      if (!productMap.has(key)) productMap.set(key, []);
      const arr = productMap.get(key);
      // cap here — products already sorted by popularity
      if (arr.length < MAX_PRODUCTS_PER_SUBCATEGORY) arr.push(product);
    }

    const cappedProductIds = [];
    for (const arr of productMap.values()) {
      for (const p of arr) cappedProductIds.push(p.productId);
    }

    // ---------- Step 3: Fetch rooms only for the capped product set ----------
    const rooms = await Room.find({
      productId: { $in: cappedProductIds },
    }).lean();

    const roomMap = new Map();
    for (const room of rooms) {
      if (!roomMap.has(room.productId)) roomMap.set(room.productId, []);
      roomMap.get(room.productId).push(room);
    }

    // ---------- Step 4: Deduped queue per subcategory ----------
    const subcategoryRoomQueues = new Map();
    for (const sub of subcategories) {
      const key = `${sub.category}__${sub.subcategory}`;
      const subProducts = productMap.get(key);
      if (!subProducts?.length) continue;

      const queue = [];
      const seen = new Set();
      for (const product of subProducts) {
        const matchedRooms = roomMap.get(product.productId);
        if (!matchedRooms?.length) continue;
        for (const room of matchedRooms) {
          const id = String(room._id);
          if (seen.has(id)) continue;
          seen.add(id);
          queue.push(room);
        }
      }
      if (queue.length) subcategoryRoomQueues.set(key, queue);
    }

    // ---------- Step 5: Bucket by roomType ----------
    const roomTypeBuckets = new Map();
    for (const sub of subcategories) {
      const key = `${sub.category}__${sub.subcategory}`;
      const queue = subcategoryRoomQueues.get(key);
      if (!queue?.length) continue;

      for (const room of queue) {
        const roomType = room.roomType || "Other";
        if (!roomTypeBuckets.has(roomType)) roomTypeBuckets.set(roomType, new Map());
        const subMap = roomTypeBuckets.get(roomType);
        if (!subMap.has(key)) subMap.set(key, []);
        subMap.get(key).push(room);
      }
    }

    // ---------- Step 6: Round-robin with index cursors (no shift) ----------
    const finalRooms = [];
    const addedRoomIds = new Set();

    for (const [, subMap] of roomTypeBuckets.entries()) {
      const orderedSubKeys = subcategories
        .map((sub) => `${sub.category}__${sub.subcategory}`)
        .filter((key) => subMap.has(key));

      // cursor per subcategory queue instead of mutating with shift()
      const cursors = new Map(orderedSubKeys.map((k) => [k, 0]));

      let selectedCount = 0;
      let progressed = true;

      while (selectedCount < MAX_ROOMS_PER_TYPE && progressed) {
        progressed = false;

        for (const key of orderedSubKeys) {
          if (selectedCount >= MAX_ROOMS_PER_TYPE) break;

          const queue = subMap.get(key);
          let idx = cursors.get(key);
          if (idx >= queue.length) continue;

          const room = queue[idx];
          cursors.set(key, idx + 1);
          progressed = true;

          const id = String(room._id);
          if (addedRoomIds.has(id)) continue;

          addedRoomIds.add(id);
          finalRooms.push(room);
          selectedCount++;
        }
      }
    }

    return res.status(200).json(finalRooms);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      err: error.message || "Error while fetching rooms!",
    });
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
      room = await Room.findOne({
        roomType: { $regex: new RegExp(`^${roomType.replace(/[-\s]+/g, "[-\\s]*")}$`, "i") },
      });
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
    //console.log(req.body);

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
    //console.log(category);
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
    //console.log(error)
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
    //console.log(error);
    res.status(500).json({ err: error.message || "Error while deleting room!" });
  }
};
