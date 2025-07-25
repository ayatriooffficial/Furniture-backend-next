const { default: axios } = require("axios");
const MapPlacesModel = require("../model/mapmodel");
const ShippingRateModel = require("../model/ShippingRate");

const getMapPlaces = async (req, res) => {
  try {
    const MapPlaces = await MapPlacesModel.find();
    res.status(200).json(MapPlaces);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const createMapPlaces = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(406).send("Please provide product data");
    }

    const {
      name,
      address,
      phone,
      pincode,
      geo_location,
      category,
      profileImg,
      images,
    } = req.body;

    const newMapDetail = new MapPlacesModel({
      name,
      address,
      phone,
      pincode,
      geo_location: {
        latitude: geo_location.latitude,
        longitude: geo_location.longitude,
      },
      images,
      profileImg,
      category,
    });

    const mapData = await newMapDetail.save();

    res.status(201).json({ message: "New map created successfully!...." });
  } catch (error) {
    // console.log(error);
    res.status(409).json({ message: error.message });
  }
};

const deleteMapPlaces = async (req, res) => {
  const mapId = req.params.mapId;

  try {
    const result = await MapPlacesModel.findOneAndDelete({ _id: mapId });

    if (!result) {
      return res.status(404).json({ message: 'Map details not found' });
    }

    // Fetch updated data after deletion
    const updatedData = await MapPlacesModel.find();

    res.json(updatedData);
  } catch (error) {
    console.error('Error deleting map:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getDistance = async (req, res) => {
  try {
    const { origins, destinations } = req.query;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origins}&destinations=${destinations}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(url);

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchMapStore = async (req, res) => {
  try {
    const { search } = req.query;
    let query = MapPlacesModel.find({});
    if (search) {
      query = query.find({
        $or: [
          { name: { $regex: new RegExp(search, "i") } },
          { address: { $regex: new RegExp(search, "i") } },
        ],
      });
    }
    const stores = await query;
    res.status(200).json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const calculateShippingDetails = async (req, res) => {
  try {
    const { userPincode } = req.query;

    if (!userPincode) {
      return res.status(400).json({ message: "User pincode is required" });
    }

    // Step 1: Fetch all stores from the maps collection
    const stores = await MapPlacesModel.find();
    if (!stores || stores.length === 0) {
      return res.status(404).json({ message: "No stores found" });
    }

    // Step 2: Calculate distances to each store
    const distances = await Promise.all(
      stores.map(async (store) => {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${userPincode}&destinations=${store.pincode}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const response = await axios.get(url);

        if (response.data.status !== "OK") {
          throw new Error("Distance API error: " + response.data.status);
        }

        const distanceValue = response.data.rows[0].elements[0].distance.value; // Distance in meters
        const distanceKm = (distanceValue / 1000).toFixed(1); // Convert to km

        return {
          store: {
            id: store._id,
            name: store.name,
            address: store.address,
            pincode: store.pincode,
          },
          distance: parseFloat(distanceKm),
        };
      })
    );

    // Step 3: Find the closest store
    distances.sort((a, b) => a.distance - b.distance);
    const closestStore = distances[0];

    // Step 4: Fetch shipping rates from the ShippingRate collection
    const shippingRates = await ShippingRateModel.find();
    if (!shippingRates || shippingRates.length === 0) {
      return res.status(404).json({ message: "No shipping rates defined" });
    }

    // Step 5: Determine the applicable shipping rate based on distance
    const distanceKm = closestStore.distance;
    let shippingCharge = 0;
    let estimatedDelivery = 0;

    const applicableRate = shippingRates.find(
      (rate) => distanceKm >= rate.minDistance && distanceKm <= rate.maxDistance
    );

    if (applicableRate) {
      shippingCharge = applicableRate.charge;
      estimatedDelivery = applicableRate.estimatedDelivery;
    } else {
      // Fallback: Use the highest rate if distance exceeds all defined ranges
      const maxRate = shippingRates.reduce((prev, curr) =>
        curr.maxDistance > prev.maxDistance ? curr : prev
      );
      shippingCharge = maxRate.charge + (distanceKm - maxRate.maxDistance) * 3; // ₹3 per km over the max range
      estimatedDelivery = maxRate.estimatedDelivery + 1; // Add 1 day for extended range
    }

    // Step 6: Return the closest store, distance, charge, and estimated delivery
    res.status(200).json({
      closestStore: closestStore.store,
      distance: distanceKm,
      charge: Math.round(shippingCharge),
      estimatedDelivery,
    });
  } catch (error) {
    console.error("Error calculating shipping details:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMapPlaces,
  createMapPlaces,
  deleteMapPlaces,
  getDistance,
  searchMapStore,
  calculateShippingDetails,
};