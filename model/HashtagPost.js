const mongoose = require("mongoose");

const HashtagPostSchema = mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true, // Add unique constraint
    },
    username: String,
    mediaUrl: {
      type: String,
      required: true,
    },
    postUrl: {
      type: String,
      required: true,
    },
    s3MediaUrl: {
      type: String,
      required: false, // S3 URL, initially empty
      default: "",
    },
    caption: {
      type : String,
      required: false, // Caption field
      default: "", // Default value for caption
    }, // Add caption field
    products: [
      {
        type: mongoose.Schema.Types.ObjectId, // Change to ObjectId
        ref: "products",
      },
    ],
    categoryId: {
      type: String,
      required: false, // Add reference to Category model
    },
    categoryName: {
      type: String,
    },
  },
  { timestamps: true } // Add timestamps
);

module.exports = mongoose.model("HashtagPost", HashtagPostSchema);