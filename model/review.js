const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  reviewId: {
    type: String,
    unique: true,
    required: true,
  },
  userEmail: {
    type: String,
  },
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  comment: {
    type: String,
    required: true,
  },
  images: [
    {
      type: String,
    },
  ],
  profilePic: {
    type: String,
    default: "https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/default.png",
  },
  userId : {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  dynamicRatings: [
    {
      name: {
        type: String,
      },
      value: {
        type: Number,
        default: 0,
      },
    },
  ],
});
const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
