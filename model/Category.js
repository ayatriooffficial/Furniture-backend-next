const { text } = require("body-parser");
const mongoose = require("mongoose");
const FeatureSchema = new mongoose.Schema({
  title: { type: String },
  description: [{ type: String }],
  descriptionLinks: [
    {
      text: String,
      link: String,
    },
  ],
  displayType : {
    type: String,
    enum: ["cardSVG", "card", "Tip", "Comparison"],
    default: "card",
  },
  svg: {
    type: String,
    required: false,
    default: null,
  },
});

const subcategorySchema = new mongoose.Schema({
  metadata: {
    type: {
      title: String,
    },
  },
  faq: [
    {
      heading: { type: String ,},
      description: { type: String },
      linkText:[{
        text: { type: String },
        link: { type: String },
      }
      ]
    },
  ],
  name: {
    type: String,
    required: true,
    set: (value) => value.trim(),
  },
  description: {
    type: String,
  },
  img: {
    type: String,
    // required: true,
  },
  popularity: {
    type: Number,
    default: 0,
  },
  isAccessories: {
    type: Boolean,
    default: false,
  },
  showInSubCategory: {
    type: Boolean,
    default: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
    },
  ],
  features: [FeatureSchema],
  pdesc: {
    description: { type: String },
    linkText: [
      {
        text: { type: String },
        link: { type: String },
      },
    ],
  },
  h1title: { type: String },
});

const categorySchema = new mongoose.Schema({
  h1tag: { type: String },
  metadata: {
    type: {
      title: String,
    },
  },
  name: {
    type: String,
    required: true,
    unique: true,
    set: (value) => value.trim(),
  },
  description: {
    type: String,
  },
  h1title: { type: String },
  image: {
    type: String,
    required: true,
  },
  subcategories: {
    type: [subcategorySchema],
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  popularity: {
    type: Number,
    default: 0,
  },
  maintenanceDetails: [
    {
      heading: { type: String },
      description: { type: String },
    },
  ],
  installationDetails: [
    {
      heading: { type: String },
      description: { type: String },
    },
  ],
  faq: [
    {
      heading: { type: String ,},
      description: { type: String },
      linkText:[{
        text: { type: String },
        link: { type: String },
      }
      ]
    },
  ],
  // certification: {
  //   type: String,
  // },
  availableColors: {
    type: [{ name: String, hexCode: String }],
  },
  availableServices: {
    type: [{ name: String, cost: Number, unitType: String }],
  },
  specialRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "rooms",
  },
  availableRatingTypes: {
    type: [{ name: String, image: String }],
  },
  showCalculator: {
    type: Boolean,
    default: false,
  },
  firstGrid: {
    title: { type: String },
    description: { type: String },
    link: { type: String },
    image: { type: String },
  },
  secondGrid: {
    title: { type: String },
    description: { type: String },
    link: { type: String },
    image: { type: String },
  },
  features: [FeatureSchema],
  pdesc: {
    description: { type: String },
  },
});

const categoriesDB = mongoose.model("ProductCategories", categorySchema);

module.exports = categoriesDB;