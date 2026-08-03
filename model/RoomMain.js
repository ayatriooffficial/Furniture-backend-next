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
        description: { type: String },
        subHeading: { type: String }, // NEW: 2nd heading under the feature name
        tip: {
          type: String,
        },
        displayType: {
          type: String,
          required: true,
          enum: ['card', 'cardSVG', 'comparison', 'tips'],
          default: 'card'
        },
        icon: { type: String },
        cards: [
          {
            description: { type: String },
            svgUrl: { type: String },
            heading: { type: String }, // NEW: card heading
            cardType: { // NEW: per-card type — overrides feature.displayType for this card
              type: String,
              enum: ['card', 'cardSVG', 'comparison'],
              default: 'card',
            },
            leftHeading: { type: String }, // NEW: comparison left column heading
            rightHeading: { type: String }, // NEW: comparison right column heading
            columns: [ // NEW: comparison option columns (e.g. ["Vinyl Floor", "Laminated Floor"])
              { name: { type: String } },
            ],
            rows: [ // NEW: comparison rows (e.g. { label: "Price", values: ["500-800", "1000-1500"] })
              {
                label: { type: String },
                values: [{ type: String }],
              }
            ],
            points: [ // NEW: bullet list (left column for comparison)
              {
                text: { type: String },
              }
            ],
            pointsRight: [ // NEW: right column for comparison
              {
                text: { type: String },
              }
            ],
          }
        ],
      }
    ],
  },
  { versionKey: false, timestamps: true, strictPopulate: false }
);

const RoomMain = mongoose.model("roomMain", roomSchema);

module.exports = RoomMain;