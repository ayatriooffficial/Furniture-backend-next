const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    metadata: {
      type: {
        title: String,
      },
    },
    roomType: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    heading: {
      type: String,
      required: true,
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
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
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
    firstSlider: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
    ],
    secondSlider: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
    ],
    thirdSlider: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
    ],
    forthSlider: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
    ],
    fifthSlider: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
    ],
    sliders: {
      firstSlider: {
        header: { type: String },
        description: { type: String },
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
        header: { type: String },
        description: { type: String },
        products: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
          },
        ],
      },
      thirdSlider: {
        header: { type: String },
        description: { type: String },
        products: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
          },
        ],
      },
      forthSlider: {
        header: { type: String },
        description: { type: String },
        products: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
          },
        ],
      },
      fifthSlider: {
        header: { type: String },
        description: { type: String },
        products: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
          },
        ],
      },
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
          "faqs",
          "features",
        ],
        type: String,
        required: true,
      },
    ],
    faqs: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        linkText: [{ 
          text: { type: String }, 
          link: { type: String }
        }]
      },
    ],
    features: [
      {
        name: { type: String, required: true },
        description: { type: String, required: true },
        tip:{
          type: String,
        },
        displayType: { 
          type: String, 
          required: true,
          enum: ['card', 'cardSVG', 'comparison','tips'],
          default: 'card'
        },
        icon: { type: String},
      }
    ],
  },
  { versionKey: false, timestamps: true, strictPopulate: false }
);

const RoomMain = mongoose.model("roomMain", roomSchema);

module.exports = RoomMain;