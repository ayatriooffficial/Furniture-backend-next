const mongoose = require("mongoose");

const bannerSectionSchema = new mongoose.Schema({
  mainHeading: { type: String },
  description: { type: String },
  link: { type: String },
  grid: [
    {
      text: { type: String },
      room: { type: mongoose.Schema.Types.ObjectId, ref: "rooms" },
    },
  ],
});

const bannerSectionDB = mongoose.model("bannerSectionImg", bannerSectionSchema);

module.exports = bannerSectionDB;
