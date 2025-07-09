const newProductSectionDB = require("../../model/newProductSection");
const Room = require("../../model/room");
// POST: '/api/createnewProductSection'  - homepageRoutes.js
exports.createProductSection = async (req, res) => {
  try {
    const mode = req.body.type;
    const { room1, room2, room3, room4 } = req.body;
    if (mode === "room") {
      if (!room1 || !room2 || !room3) {
        return res.status(400).json({ message: "Please select all rooms" });
      }
      let rooms = [];
      const roomData1 = await Room.findById(room1);
      if (roomData1) {
        rooms.push(roomData1._id);
      } else {
        console.log(`Room 1 not found.`);
        return res.status(404).json({ message: "Room 1 not found." });
      }
      const roomData2 = await Room.findById(room2);
      if (roomData2) {
        rooms.push(roomData2._id);
      } else {
        console.log(`Room 2 not found.`);
        return res.status(404).json({ message: "Room 2 not found." });
      }
      const roomData3 = await Room.findById(room3);
      if (roomData3) {
        rooms.push(roomData3._id);
      } else {
        console.log(`Room 3 not found.`);
        return res.status(404).json({ message: "Room 3 not found." });
      }
      if (room4) {
        const roomData4 = await Room.findById(room4);
        if (roomData4) {
          rooms.push(roomData4._id);
        } else {
          console.log(`Room 4 not found.`);
          return res.status(404).json({ message: "Room 4 not found." });
        }
      }

      const imageUrl = req.files
        .filter((file) => file.fieldname === "image")
        .map((file) => file.location);


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
        .map((file) => file.location);
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
    let info = await newProductSectionDB.find().populate({
      path: "rooms",
      model: Room,
    });
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
