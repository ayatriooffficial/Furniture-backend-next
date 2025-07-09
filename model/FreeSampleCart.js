const mongoose = require("mongoose");

const freeSampleCartSchema = new mongoose.Schema({
  owner: {
    type: String,
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
    },
  ],
});

module.exports = FreeSampleCartDB = mongoose.model(
  "FreeSampleCart",
  freeSampleCartSchema
);
