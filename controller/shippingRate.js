// routes/shippingRates.js
const ShippingRate = require("../model/ShippingRate");

// Get all shipping rates
exports.geShippingRate = async (req, res) => {
  try {
    const shippingRates = await ShippingRate.find().sort({ minDistance: 1 });
    res.json(shippingRates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a new shipping rate
exports.createShippingRate = async (req, res) => {
  const shippingRate = new ShippingRate({
    minDistance: req.body.minDistance,
    maxDistance: req.body.maxDistance,
    charge: req.body.charge,
    estimatedDelivery: req.body.estimatedDelivery,
  });
  try {
    const newShippingRate = await shippingRate.save();
    res.status(201).json(newShippingRate);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a shipping rate
exports.editShippingRate = async (req, res) => {
  try {
    const updatedShippingRate = await ShippingRate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedShippingRate);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a shipping rate
exports.deleteShippingRate = async (req, res) => {
  try {
    await ShippingRate.findByIdAndDelete(req.params.id);
    res.json({ message: "Shipping rate deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.calculateShippingDetails = async (req, res) => {
  try {
    const { distance } = req.params;
    if (!distance || isNaN(distance)) {
      return res.status(400).json({ message: "Invalid distance provided" });
    }
    console.log("Calculating shipping details for distance:", distance);
    const shippingRates = await ShippingRate.find();
    for (let rate of shippingRates) {
      if (distance >= rate.minDistance && distance <= rate.maxDistance) {
        console.log("Shipping charge:", rate.charge, "Estimated delivery:", rate.estimatedDelivery);
        return res.status(200).json({ charge: rate.charge, estimatedDelivery: rate.estimatedDelivery });
      }
    }
    res.status(200).json({ charge: null, estimatedDelivery: null}); // or a default charge if you want
  } catch (err) {
    console.log(err)
    throw new Error("Error calculating shipping charge");
  }
};