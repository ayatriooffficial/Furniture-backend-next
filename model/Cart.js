const mongoose = require("mongoose");
const ObjectID = mongoose.Schema.Types.ObjectId

const cartSchema = new mongoose.Schema({
  owner: {
    type: String,
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: true,
      },
      name: String,  // maybe here  productName: String
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
  freeSamples: [{ type: mongoose.Schema.Types.ObjectId, ref: 'products' }],
  bill: {
    type: Number,
    required: true,
    default: 0,
  },
},
  {
    timestamps: true,
  }
);

module.exports = CartDB = mongoose.model("Cart", cartSchema);
