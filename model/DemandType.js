const mongoose = require("mongoose");

const demandTypeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DemandType = mongoose.model("DemandType", demandTypeSchema);

module.exports = DemandType;
