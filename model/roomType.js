const mongoose = require("mongoose");

const roomTypeSchema = new mongoose.Schema({
  roomType: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    require: true,
  },
});

const RoomTypeDB = mongoose.model("roomType", roomTypeSchema);

module.exports = RoomTypeDB;
