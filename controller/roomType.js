const RoomTypeDB = require("../model/roomType");

exports.getRoomTypes = async (req, res) => {
  try {
    const roomTypes = await RoomTypeDB.find();

    res.status(200).json(roomTypes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createRoomType = async (req, res) => {
  try {
    const imageUrls = req.files
      .filter((file) => file.fieldname === "image")
      .map((file) => file.location);
    const { roomType } = req.body;

    if (!roomType) {
      return res.status(400).send("roomType is required");
    }

    const room = new RoomTypeDB({
      roomType,
      image: imageUrls[0],
    });

    await room.save();

    res.status(200).json({ message: "Room type created successfully", roomType: room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteRoomTypeById = async (req, res) => {
  try {
    const { roomTypeId } = req.params;

    const roomType = await RoomTypeDB.findById(roomTypeId);

    if (!roomType) {
      return res.status(404).json({ message: "Room type not found" });
    }

    await RoomTypeDB.findByIdAndDelete(roomTypeId);

    res.status(200).json({ message: "Room type deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
