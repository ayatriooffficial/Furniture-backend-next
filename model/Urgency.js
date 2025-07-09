const mongoose = require("mongoose");

const urgencySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
  },
});

const Urgency = mongoose.model("urgency", urgencySchema);

module.exports = Urgency;
