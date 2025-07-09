//  controller for the banner section
const bannerSectionDB = require("../../model/bannerSection");
const Room = require("../../model/room");

// POST: '/api/createBannerSection'  - homepageRoutes.js
exports.createBannerSection = async (req, res) => {
  try {
    console.log(req.body);
    const { text1, text2, link,  roomId1, roomId2, mainHeading, description } = req.body;
    const room1 = await Room.findById(roomId1);
    if (!room1) {
      return res.status(404).json({ message: "Room 1 not found" });
    }
    const room2 = await Room.findById(roomId2);
    if (!room2) {
      return res.status(404).json({ message: "Room 2 not found" });
    }

   const mappedRoom = [{ text: text1, room: room1._id }, { text: text2, room: room2._id }];
   console.log(mappedRoom);
    const bannerSection = new bannerSectionDB({
      grid: mappedRoom,
      mainHeading,
      description,
      link,
    });
    await bannerSection.save();

    res
      .status(201)
      .json({ message: "Banner section image added successfully! " });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET: '/api/getBannerSection'  - homepageRoutes.js
exports.getBannerSection = async (req, res) => {
  try {
    const info = await bannerSectionDB.find().populate("grid.room");
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST: '/api/deleteBannerSection/:imgId'  - homepageRoutes.js
exports.deleteBannerSection = async (req, res) => {
  const { imgId } = req.params;

  try {
    const result = await bannerSectionDB.findOneAndDelete({ _id: imgId });

    if (!result) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Fetch updated data after deletion
    const updatedData = await bannerSectionDB.find();
    res.json(updatedData);
  } catch (error) {
    console.error("Error deleting images section:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
