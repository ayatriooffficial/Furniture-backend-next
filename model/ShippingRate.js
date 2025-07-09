// models/ShippingRate.js
const mongoose = require('mongoose');

const ShippingRateSchema = new mongoose.Schema({
  minDistance: {
    type: Number,
    required: true
  },
  maxDistance: {
    type: Number,
    required: true
  },
  charge: {
    type: Number,
    required: true
  },
  estimatedDelivery: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('ShippingRate', ShippingRateSchema);
