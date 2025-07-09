const mongoose = require("mongoose");

const liveRoomAdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true },
  topic: String,
});

module.exports = mongoose.model("LiveRoomAdmin", liveRoomAdminSchema);
