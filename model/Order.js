const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  address: { type: String, required: true },
  postalCode: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
});

const OrderSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    isFreeSample: { type: Boolean, default: false },
    freeSampleCartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreeSampleCart",
    },
    cartId: { type: mongoose.Schema.Types.ObjectId, ref: "Cart" },
    items: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
          },
          price: Number,
          selectedServices: [{ name: String, cost: Number, quantity: Number, unitType : String }],
          selectedAccessories: [{ quantity: Number }],
        },
      ],
    payment: { type: Boolean, default: false },
    paymentStatus: { type: String },
    transactionId: { type: String },
    paymentMode: { type: String },
    address: { type: addressSchema, required: true },
    amount: {
      deliveryPrice: Number,
      productPrice: Number,
      totalPrice: Number,
    },
  },
  { timestamps: true }
);

module.exports = CheckoutDB = mongoose.model("order", OrderSchema);
