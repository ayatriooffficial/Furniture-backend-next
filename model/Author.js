const mongoose = require("mongoose");

const authorSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true },
  image: {
    type: String,
    default: "https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/default.png",
  },
  description: {
    type: String,
  },
  awards: {
    type: [String],
  },
  rating: {
    type: Number,
  },
  link: {
    type: String,
  },
  experience: {
    type: String,
  },
  purchase:{
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
});

module.exports = mongoose.model("authors", authorSchema);