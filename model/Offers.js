const mongoose = require("mongoose");

const offersSchema = new mongoose.Schema({
  metadata: {
    type: {
      title: String,
    },
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    required: true,
    unique: true,
  },
  percentageOff: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  chunkSize: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Offers = mongoose.model("Offers", offersSchema);

module.exports = Offers;
