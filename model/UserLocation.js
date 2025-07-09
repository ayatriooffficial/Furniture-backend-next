const mongoose = require("mongoose");

const UserLocationSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
  },
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
  pincode: {
    type: Number,
    required: true,
  },
});

const UserLocation = mongoose.model("UserLocation", UserLocationSchema);
UserLocation.createIndexes({ deviceId: 1 });

module.exports = UserLocation;
