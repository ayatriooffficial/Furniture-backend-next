const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
  streetAddress: {
    type: String,
    required: true,
  },
  pincode: {
    type: Number,
    required: true,
  },
  country: String,
});

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "Ayatrio",
  },
  address: {
    type: addressSchema,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Store", storeSchema);
