const mongoose = require("mongoose");

const newProductItemSchema = new mongoose.Schema({
  img: { type: String, required: true },
  heading: { type: String },
  description: { type: String },
  offer: { type: String, required: true },
  mainHeading: { type: String }
});

const newProductSectionSchema = new mongoose.Schema({
  items: [newProductItemSchema],
  mode: { type: String, required: true },
  rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
});

const newProductSectionDB = mongoose.model(
  "newProductSectionImg",
  newProductSectionSchema
);

module.exports = newProductSectionDB;
