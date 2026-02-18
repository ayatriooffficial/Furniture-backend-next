const mongoose = require("mongoose");
const circleSchema = new mongoose.Schema({
  productTitle: String,
  productCategory: String,
  price: Number,
  topPosition: Number,
  leftPosition: Number,
  productLink: String,
});
const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  patternNumber: { type: String, required: true, unique: true },
  productTitle: { type: String, required: true, trim: true },
  productImages: {
    type: [
      {
        type: {
          color: { type: String },
          images: { type: [String] },
        },
      },
    ],
  },
  roomCategory: { type: [String], required: true },
  category: { type: String, required: true, trim: true },
  subcategory: { type: String },
  demandtype: { type: String },
  offer: { type: String, default: null },
  externalOffers: [
    {
      offerId: { type: mongoose.Schema.Types.ObjectId, ref: "ExternalOffer" },
      name: { type: String },
      type: { type: String },
      discountType: { type: String },
      discountValue: { type: Number },
      minimumPurchase: { type: Number },
      startDate: { type: Date },
      endDate: { type: Date },
      description: { type: String },
    },
  ],
  type: { type: String },
  availability: {
    type: String,
    enum: ["in stock", "out of stock"],
    required: true,
  },
  availabilityTime: {
    from: { type: Date },
    to: { type: Date },
  },
  shortDescription: { type: String },
  material: { type: String },
  images: { type: [String] },
  perUnitPrice: { type: Number },
  productType: {
    type: String,
    enum: ["normal", "requested", "special"],
    default: "normal",
    required: true,
  },
  ratings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  colors: { type: [String] },
  // dimensions: [
  //   {
  //     length: {
  //       value: {
  //         type: Number,
  //       },
  //       unit: {
  //         type: String,
  //         enum: ["mm", "cm", "m", "in", "ft"],
  //       },
  //     },
  //     width: {
  //       value: {
  //         type: Number,
  //       },
  //       unit: {
  //         type: String,
  //         enum: ["mm", "cm", "m", "in", "ft"],
  //       },
  //     },
  //     thickness: {
  //       value: {
  //         type: Number,
  //       },
  //       unit: {
  //         type: String,
  //         enum: ["mm", "cm", "m", "in", "ft"],
  //       },
  //     },
  //     price: {
  //       type: Number,
  //     },
  //     discountedprice: {
  //       type: Number,
  //     },
  //     specialprice: {
  //       type: Number,
  //     },
  //   },
  // ],
  dimensions: [
    {
      dimension: { type: String },
      price: { type: Number },
      discountedprice: { type: Number },
      // specialprice : { type : Number }
    },
  ],
  circles: { type: [circleSchema] },
  // units: Number,
  // unitType: {
  //   type: String,
  //   enum: ["m", "roll", "sqft", "kg", "box", "pcs"],
  //   required: true,
  // },
  unitType: {
    type: String,
    enum: ["m", "roll", "sqft", "kg", "box", "pcs"],
    required: true,
  },
  discountedprice: {
    price: Number,
    startDate: Date,
    endDate: Date,
    chunkSize: Number,
  },
  specialprice: {
    price: Number,
    startDate: Date,
    endDate: Date,
    chunkSize: Number,
  },

  popularity: {
    type: Number,
    default: 0,
  },
  purchaseMode: [String],
  otherRoom: [String],
  productDescription: String,
  coreValueIds: {
    type: Map,
    of: String,
    default: {},
  },
  featureIds: {
    type: [String],
    default: [],
  },
  pdf: { type: String },

  isFreeSampleAvailable: {
    type: Boolean,
    default: false,
  },
  isFreeShippingAvailable: {
    type: Boolean,
    default: false,
  },
  isOnlySoldInStore: {
    type: Boolean,
    default: false,
  },
  expectedDelivery: {
    type: Number,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    default: null,
  },
  faqs: [
    {
      title: { type: String, required: true },
      description: { type: String, required: true },
      linkText: [
        {
          text: { type: String },
          link: { type: String },
        },
      ],
    },
  ],
  likes: {
    type: Number,
    default: 0,
  },
  urgency: {
    type: String,
    default: null,
  },
  isAccessories: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now() },
});

const Product = mongoose.model("products", productSchema);

module.exports = Product;
