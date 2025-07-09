const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order", // Corrected to match Order model
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Corrected to match User model
    },
    userType: {
      type: String,
      default: "member",
      enum: ["guest", "member"],
    },
    paymentId: {
      type: String,
      required: true, // Since paymentCallback always provides it
    },
    cart: {
      type: Array, // Matches order.items or order.cart
      default: [],
    },
    amount: {
      type: Object, // Matches order.amount (e.g., { deliveryPrice, productPrice, totalPrice })
    },
    bankId: {
      type: String,
    },
    address: {
      type: Object, // Matches order.address (e.g., { firstName, lastName, email })
    },
  },
  { timestamps: true }
);

const Purchase = mongoose.model("Purchase", purchaseSchema); // Consistent naming

module.exports = Purchase;