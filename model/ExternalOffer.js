const mongoose = require("mongoose");

const externalOfferSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ["cashback", "firstPurchase", "secondPurchase", "bank", "other"],
    required: true,
  },
  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  minimumPurchase: {
    type: Number,
    required: true,
  },
  startDate: { type: Date },
  endDate: { type: Date },
  description: { type: String },
  metadata: {
    title: String,
  },
  applicableProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const ExternalOffer = mongoose.model("ExternalOffer", externalOfferSchema);

module.exports = ExternalOffer;
