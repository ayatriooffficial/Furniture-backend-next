const mongoose = require("mongoose");

const posterSchema = new mongoose.Schema({
  desktopImgSrc: { type: String }, //for desktop
  mobileImgSrc: { type: String }, //for phone
  text: { type: String },
  link: { type: String },
});

const posterSchemaDB = mongoose.model("posters", posterSchema);

module.exports = posterSchemaDB;
