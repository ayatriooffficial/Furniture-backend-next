const mongoose = require("mongoose");

// Define the schema
const suggestionSchema = new mongoose.Schema(
  {
    metadata: {
      type: {
        title: String,
      },
    },
    heading: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
    },

    shortSummary: {
      type: String,
      required: true,
    },
    mainImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "rooms",
    },
    fiveGrid: {
      fiveGridHeader: {
        type: String,
      },
      fiveGridDescription: {
        type: String,
      },
      fiveGridRooms: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "rooms",
        },
      ],
    },

    twoGrid: {
      twoGridHeader: {
        type: String,
      },
      twoGridDescription: {
        type: String,
      },
      twoGridRooms: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "rooms",
        },
      ],
    },
    firstSlider: {
      header: String,
      description: String,
      descriptionLinks: [
        {
          text: String,
          link: String,
        },
      ],
      products: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
        },
      ],
    },
    secondSlider: {
      header: String,
      description: String,
      descriptionLinks: [
        {
          text: String,
          link: String,
        },
      ],
      products: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
        },
      ],
    },
    thirdSlider: {
      header: String,
      description: String,
      descriptionLinks: [
        {
          text: String,
          link: String,
        },
      ],
      products: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
        },
      ],
    },
    forthSlider: {
      header: String,
      description: String,
      descriptionLinks: [
        {
          text: String,
          link: String,
        },
      ],
      products: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
        },
      ],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null
    },
    fifthSlider: {
      header: String,
      description: String,
      descriptionLinks: [
        {
          text: String,
          link: String,
        },
      ],
      products: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
        },
      ],
    },

    position: [
      {
        enum: [
          "heading",
          "mainImage",
          "twoGrid",
          "fiveGrid",
          "firstSlider",
          "secondSlider",
          "thirdSlider",
          "forthSlider",
          "fifthSlider",
          "features",
        ],
        type: String,
        required: true,
      },
    ],
    features: [
      {
        name: { type: String, required: true },
        description: { type: String, required: true },
        cards: [{
          description: { type: String },
          svgUrl: { type: String }  // optional field
        }],
        displayType: { 
          type: String, 
          required: true,
          enum: ['card', 'cardSVG', 'comparison'],
          default: 'card'
        },
        icon: { type: String }, // For card1 display type
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Create the model
const Suggestion = mongoose.model("Suggestions", suggestionSchema);

module.exports = Suggestion;
