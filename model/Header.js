const mongoose = require("mongoose");

// Subdocument schema for the icons, subheaders, and paragraphs within a section
// const SectionContentSchema = new mongoose.Schema({
//   icon: String,
//   subheader: String,
//   paragraph: String,
// });

// // Schema for each section
// const SectionSchema = new mongoose.Schema({
//   sectionName: String,
//   content: [SectionContentSchema],
// });

// // Main schema for the entire document
// const HeaderSchema = new mongoose.Schema({
//   headerTitle: String,
//   sections: [SectionSchema],
// });

const HeaderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
});

module.exports = HeaderInfoDB = mongoose.model("Header", HeaderSchema);
