const mongoose = require("mongoose");
require('dotenv').config()
// MongoDB URI
const MONGO_URI = process.env.MONGO_URI

// Define the ShippingRate schema inline
const shippingRateSchema = new mongoose.Schema({
  minDistance: {
    type: Number,
    required: true,
  },
  maxDistance: {
    type: Number,
    required: true,
  },
  charge: {
    type: Number,
    required: true,
  },
  estimatedDelivery: {
    type: Number,
    required: true,
  },
});

// Create the ShippingRate model
const ShippingRate = mongoose.model("ShippingRate", shippingRateSchema);

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const rates = [
  { minDistance: 0, maxDistance: 2, charge: 0, estimatedDelivery: 1 }, // Free delivery under 2 km
  { minDistance: 2, maxDistance: 5, charge: 50, estimatedDelivery: 2 },
  { minDistance: 5, maxDistance: 10, charge: 75, estimatedDelivery: 3 },
  { minDistance: 10, maxDistance: 20, charge: 100, estimatedDelivery: 4 },
  { minDistance: 20, maxDistance: 50, charge: 150, estimatedDelivery: 5 },
];

async function populateRates() {
  try {
    // Connect to the database
    await mongoose.connection;
    console.log("Connected to MongoDB");

    // Clear existing shipping rates
    await ShippingRate.deleteMany({});
    console.log("Cleared existing shipping rates");

    // Insert new rates
    await ShippingRate.insertMany(rates);
    console.log("Shipping rates populated successfully");
  } catch (error) {
    console.error("Error populating shipping rates:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the function
populateRates();
