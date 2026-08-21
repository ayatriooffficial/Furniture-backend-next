const newProductSectionDB = require("../../model/newProductSection");
const Room = require("../../model/room");
const Category = require("../../model/Category");
// POST: '/api/createnewProductSection'  - homepageRoutes.js
exports.createProductSection = async (req, res) => {
  try {
    const mode = req.body.type;
    const { room1, room2, room3, room4, offerRoom1, offerRoom2, offerRoom3, offerRoom4, categoryRoom1, categoryRoom2, categoryRoom3, categoryRoom4 } = req.body;
    if (mode === "room") {
      if (!room1 || !room2 || !room3) {
        return res.status(400).json({ message: "Please select all rooms" });
      }
      let rooms = [];
      const roomData1 = await Room.findById(room1);
      let cat1 = categoryRoom1 ? await Category.findOne({ name: categoryRoom1 }) : null;
      if (roomData1) {
        let roomObj = {room:roomData1._id, offer: offerRoom1};
        if (cat1) roomObj.category = cat1._id;
        rooms.push(roomObj);
      } else {
        return res.status(404).json({ message: "Room 1 not found." });
      }

      const roomData2 = await Room.findById(room2);
      let cat2 = categoryRoom2 ? await Category.findOne({ name: categoryRoom2 }) : null;
      if (roomData2) {
        let roomObj = {room:roomData2._id, offer: offerRoom2};
        if (cat2) roomObj.category = cat2._id;
        rooms.push(roomObj);
      } else {
        return res.status(404).json({ message: "Room 2 not found." });
      }

      const roomData3 = await Room.findById(room3);
      let cat3 = categoryRoom3 ? await Category.findOne({ name: categoryRoom3 }) : null;
      if (roomData3) {
        let roomObj = {room:roomData3._id, offer: offerRoom3};
        if (cat3) roomObj.category = cat3._id;
        rooms.push(roomObj);
      } else {
        return res.status(404).json({ message: "Room 3 not found." });
      }

      if (room4) {
        const roomData4 = await Room.findById(room4);
        let cat4 = categoryRoom4 ? await Category.findOne({ name: categoryRoom4 }) : null;
        if (roomData4) {
          let roomObj = {room:roomData4._id, offer: offerRoom4};
          if (cat4) roomObj.category = cat4._id;
          rooms.push(roomObj);
        } else {
          return res.status(404).json({ message: "Room 4 not found." });
        }
      }

      const imageUrl = req.files
        .filter((file) => file.fieldname === "image")
        .map((file) => file.path || file.location);

      const imageInfo = new newProductSectionDB({
        items: [
          {
            img: imageUrl.join(""),
            heading: req.body.imgTitle,
            offer: req.body.offer,
            description: req.body.description,
            mainHeading: req.body.mainHeading,
          },
        ],
        rooms: rooms,
        mode: mode,
      });
      await imageInfo.save();
      res
        .status(201)
        .json({ message: "New Product Section added successfully! " });
    } else if (mode === "offer") {
      const data = req.body;
      const imageUrls = req.files
        .filter((file) => file.fieldname === "image")
        .map((file) => file.path || file.location);
      const items = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const heading = data[`heading${i}`];
        const buttonText = data[`buttonText${i}`];
        const offer = data[`offer${i}`];
        const img = imageUrls[i] || "";
        items.push({ img: img, heading, buttonText, offer });
      }

      const imageInfo = new newProductSectionDB({ items, mode: mode });
      await imageInfo.save();

      res
        .status(201)
        .json({ message: "New Product Section (Offer) added successfully!" });
    } else {
      res.status(400).json({ message: "Invalid mode specified" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET: '/api/getnewProductSection'  - homepageRoutes.js
exports.getNewProductSection = async (req, res) => {
  try {
    let info = await newProductSectionDB.find().populate([
      {
        path: "rooms.room",
        model: Room,
      },
      {
        path: "rooms.category",
        model: Category,
      }
    ]);
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// POST: '/api/deletenewProductSection/:imgId'  - homepageRoutes.js
exports.deletenewProductSection = async (req, res) => {
  const { imgId } = req.params;

  try {
    const result = await newProductSectionDB.findOneAndDelete({ _id: imgId });

    if (!result) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Fetch updated data after deletion
    const updatedData = await newProductSectionDB.find();
    res.json(updatedData);
  } catch (error) {
    console.error("Error deleting images section:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
