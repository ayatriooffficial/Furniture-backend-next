// // const mongoose = require("mongoose");

// // const imageSchema = new mongoose.Schema({
// //   url: { type: String, required: true },
// //   altText: { type: String, required: false },
// // });

// // const categorySchema = new mongoose.Schema({
// //   categoryname: { type: String, required: true },
// //   images: [imageSchema],
// // });

// // const Category = mongoose.model("CategoryForModel", categorySchema);

// // module.exports = Category;
// const mongoose = require("mongoose");

// const imageSchema = new mongoose.Schema({
//   url: { type: String, required: true },
//   altText: { type: String, required: false },
// });

// const categorySchema = new mongoose.Schema({
//   categoryname: { type: String, required: true },
//   rooms: { type: String, required: true }, // New field added for rooms
//   images: [imageSchema],
// });

// const Category = mongoose.model("CategoryForModel", categorySchema);

// module.exports = Category;

const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  altText: { type: String, required: false },
});

const roomSchema = new mongoose.Schema({
  roomName: { type: String, required: true },
  images: [imageSchema],
});

const categorySchema = new mongoose.Schema({
  categoryname: { type: String, required: true },
  rooms: [roomSchema], // Updated to support multiple rooms with images
});

const Category = mongoose.model("CategoryForModel", categorySchema);

module.exports = Category;
