const mongoose = require("mongoose");

const circleSchema = new mongoose.Schema({
  productTitle: String,
  productCategory: String,
  productPrice: Number,
  topPosition: Number,
  leftPosition: Number,
  productLink: String
});

const SliderSchema = new mongoose.Schema({
  desktopImgSrc: { type: String },
  mobileImgSrc: { type: String},
  imgTitle: { type: String },
  link: { type: String },
  circles: { type: [circleSchema] },
  mobileSlide: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = SliderDB = mongoose.model("Slider", SliderSchema);
