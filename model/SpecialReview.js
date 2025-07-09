const mongoose = require("mongoose");

const specialReviewSchema = new mongoose.Schema({
  reviewId: {
    type: String,
    unique: true,
    required: true,
  },
  instagramUrl:{
    type: String,
  },
//   userEmail: {
//     type: String,
//   },
//   productId: {
//     type: String,
//     required: true,
//   },
  name: {
    type: String,
    required: true,
  },
//   rating: {
//     type: Number,
//     default: 0,
//   },
  comment: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: "https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/default.png",
  },
  createdAt: {
    type : Date,
    default : Date.now()
  }
});
const SpecialReview = mongoose.model("Specialreview", specialReviewSchema);
module.exports = SpecialReview;
