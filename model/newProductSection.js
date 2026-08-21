const mongoose = require("mongoose");

const newProductItemSchema = new mongoose.Schema({
  img: { type: String, required: true },
  heading: { type: String },
  description: { type: String },
  offer: { type: String, required: true },
  mainHeading: { type: String }
});

// Schema for rooms paired with room-specific offers
const roomOfferSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductCategories",
    required: true,
  },
  offer: { type: String, required: true }
}, { _id: false }); // Prevents generating extra _id fields for nested items if not needed

const newProductSectionSchema = new mongoose.Schema({
  items: [newProductItemSchema],
  mode: { type: String, required: true },
  rooms: [roomOfferSchema] // Updated to use the roomOfferSchema
});

const newProductSectionDB = mongoose.model(
  "newProductSectionImg",
  newProductSectionSchema
);

module.exports = newProductSectionDB;