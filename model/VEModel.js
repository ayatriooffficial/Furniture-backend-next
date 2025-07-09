const mongoose = require("mongoose");

const VESchema = mongoose.Schema({
  category: {
    type: String,
    enum: ["flooring", "wallpaper", "curtains", "Blinds"],
    required: true,
  },
  rooms: [
    {
      title: {
        type: String,
        required: true,
      },
      img: {
        type: String,
        required: true,
      },
      id: {
        type: String,
        required: false,
      },
    },
  ],
  style: [
    {
      title: {
        type: String,
        required: false,
      },
      img: {
        type: String,
        required: false,
      },
    },
  ],
  selectiveproducts: [
    {
      title: {
        type: String,
        required: false,
      },
      img: {
        type: String,
        required: false,
      },
    },
  ],
  price: [
    {
      Lable: {
        type: String,
        required: false,
      },
      price: {
        type: Number,
        required: false,
        min: 0,
      },
    },
  ],
  color: [
    {
      title: {
        type: String,
        required: false,
      },
      img: {
        type: String,
        required: false,
      },
    },
  ],
});
const VirtualExperience = mongoose.model("VirtualExperience", VESchema);

module.exports = VirtualExperience;
