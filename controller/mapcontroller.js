const { default: axios } = require("axios");
const MapPlacesModel = require("../model/mapmodel");
const ShippingRateModel = require("../model/ShippingRate");

// ─── Helper: Haversine distance in km ─────────────────────────────────────────
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── Helper: Format duration from seconds (int) to readable string ─────────────
function formatDuration(seconds) {
  const s = typeof seconds === "string" ? parseInt(seconds, 10) : seconds;

  if (!Number.isFinite(s) || s < 0) return "Unknown";

  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hours > 0) return `${hours} hr ${minutes} min`;
  if (minutes > 0) return `${minutes} min`;
  return `${secs} sec`;
}

// ─── Helper: Normalize travelMode to Routes API v2 enum ───────────────────────
function normalizeTravelMode(mode) {
  const map = {
    driving: "DRIVE",
    drive: "DRIVE",
    walking: "WALK",
    walk: "WALK",
    bicycling: "BICYCLE",
    bicycle: "BICYCLE",
    transit: "TRANSIT",
    two_wheeler: "TWO_WHEELER",
  };
  return map[(mode || "driving").toLowerCase()] || "DRIVE";
}

// ─── Helper: Classify Google Maps API errors ──────────────────────────────────
function classifyGoogleError(status, httpStatus) {
  switch (status) {
    case "REQUEST_DENIED":
      return {
        code: 403,
        message:
          "Google Maps API request was denied. Please check your API key and enabled APIs.",
      };
    // case "OVER_DAILY_LIMIT":
    case "OVER_QUERY_LIMIT":
      return {
        code: 429,
        message: "Google Maps API quota exceeded. Please try again later.",
      };
    case "INVALID_REQUEST":
      return { code: 400, message: "Invalid request parameters." };
    case "NOT_FOUND":
      return { code: 404, message: "No route or result found." };
    case "ZERO_RESULTS":
      return {
        code: 404,
        message: "No results found for the given parameters.",
      };
    default:
      return {
        code: httpStatus || 500,
        message: `Google Maps API error: ${status}`,
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /mapPlaces
// ─────────────────────────────────────────────────────────────────────────────
const getMapPlaces = async (req, res) => {
  try {
    const MapPlaces = await MapPlacesModel.find();
    if (!MapPlaces || MapPlaces.length === 0) {
      return res.status(404).json({ message: "No map places found in database." });
    }
    res.status(200).json(MapPlaces);
  } catch (error) {
    console.error("Error fetching map places:", error);
    res.status(500).json({ message: "Internal server error while fetching map places." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /createMapPlaces
// ─────────────────────────────────────────────────────────────────────────────
const createMapPlaces = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Please provide store data." });
    }

    const { name, address, phone, pincode, geo_location, category, profileImg, images } =
      req.body;

    // Validate required fields
    if (!name || !address || !phone || !pincode) {
      return res.status(400).json({ message: "name, address, phone, and pincode are required." });
    }

    
    if (
      !geo_location ||
      geo_location.latitude == null ||
      geo_location.longitude == null
    ) {
      return res.status(400).json({ message: "geo_location with latitude and longitude is required." });
    }
    
    const latitude = Number(geo_location.latitude);
    const longitude = Number(geo_location.longitude);
    
    // Validate numeric values
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        message:
          "geo_location.latitude and geo_location.longitude must be valid numbers.",
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        message: "Latitude must be between -90 and 90."
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        message: "Longitude must be between -180 and 180."
      });
    }

    const newMapDetail = new MapPlacesModel({
      name,
      address,
      phone,
      pincode,
      geo_location: {
        latitude: latitude,
        longitude: longitude,
      },
      images: images || [],
      profileImg,
      category: category || [],
    });

    await newMapDetail.save();
    res.status(201).json({ message: "New store created successfully!" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A store at these coordinates already exists.",
      });
    }
    console.error("Error creating map place:", error);
    res.status(500).json({ message: "Internal server error while creating store." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /mapPlaces/:mapId
// ─────────────────────────────────────────────────────────────────────────────
const deleteMapPlaces = async (req, res) => {
  const { mapId } = req.params;
  try {
    const result = await MapPlacesModel.findOneAndDelete({ _id: mapId });
    if (!result) {
      return res.status(404).json({ message: "Store not found." });
    }
    const updatedData = await MapPlacesModel.find();
    res.json(updatedData);
  } catch (error) {
    console.error("Error deleting map place:", error);
    res.status(500).json({ message: "Internal server error while deleting store." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /distance
// ─────────────────────────────────────────────────────────────────────────────
const getDistance = async (req, res) => {
  try {
    const { origins, destinations } = req.query;
    if (!origins || !destinations) {
      return res.status(400).json({ message: "origins and destinations query params are required." });
    }
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(503).json({ message: "Google Maps API key is not configured on the server." });
    }
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(url);

    if (response.data.status !== "OK") {
      const err = classifyGoogleError(response.data.status);
      return res.status(err.code).json({ message: err.message, apiStatus: response.data.status });
    }
    res.json(response.data);
  } catch (error) {
    console.error("Error getting distance:", error.message);
    res.status(500).json({ message: "Failed to fetch distance from Google Maps API." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /searchMapStore
// ─────────────────────────────────────────────────────────────────────────────
const searchMapStore = async (req, res) => {
  try {
    const { search } = req.query;
    let query = MapPlacesModel.find({});
    if (search && search.trim()) {
      query = query.find({
        $or: [
          { name: { $regex: new RegExp(search.trim(), "i") } },
          { address: { $regex: new RegExp(search.trim(), "i") } },
        ],
      });
    }
    const stores = await query;
    if (!stores || stores.length === 0) {
      return res.status(404).json({ message: "No stores found matching the search criteria." });
    }
    res.status(200).json(stores);
  } catch (error) {
    console.error("Error searching stores:", error);
    res.status(500).json({ message: "Internal server error during store search." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /calculateShippingDetails
// ─────────────────────────────────────────────────────────────────────────────
const calculateShippingDetails = async (req, res) => {
  try {
    const { userPincode } = req.query;
    if (!userPincode) {
      return res.status(400).json({ message: "userPincode query param is required." });
    }
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(503).json({ message: "Google Maps API key is not configured on the server." });
    }

    const stores = await MapPlacesModel.find();
    if (!stores || stores.length === 0) {
      return res.status(404).json({ message: "No stores found in the database." });
    }

    // Calculate distances to each store
    const distances = await Promise.all(
      stores.map(async (store) => {
        try {
          const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(userPincode)}&destinations=${encodeURIComponent(store.pincode)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
          const response = await axios.get(url);

          if (response.data.status !== "OK") {
            console.warn(`Distance API warning for store ${store.name}: ${response.data.status}`);
            return null;
          }

          const element = response.data.rows[0]?.elements[0];
          if (!element || element.status !== "OK") {
            console.warn(`Element status error for store ${store.name}:`, element?.status);
            return null;
          }

          const distanceKm = (element.distance.value / 1000).toFixed(1);
          return {
            store: {
              id: store._id,
              name: store.name,
              address: store.address,
              pincode: store.pincode,
            },
            distance: parseFloat(distanceKm),
          };
        } catch (err) {
          console.error(`Error calculating distance for store ${store.name}:`, err.message);
          return null;
        }
      })
    );

    const validDistances = distances.filter(Boolean);
    if (validDistances.length === 0) {
      return res.status(503).json({ message: "Could not calculate distances to any store. Please check your API key." });
    }

    validDistances.sort((a, b) => a.distance - b.distance);
    const closestStore = validDistances[0];

    const shippingRates = await ShippingRateModel.find();
    if (!shippingRates || shippingRates.length === 0) {
      return res.status(404).json({ message: "No shipping rates defined." });
    }

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
      const maxRate = shippingRates.reduce((prev, curr) =>
        curr.maxDistance > prev.maxDistance ? curr : prev
      );
      shippingCharge = maxRate.charge + (distanceKm - maxRate.maxDistance) * 3;
      estimatedDelivery = maxRate.estimatedDelivery + 1;
    }

    res.status(200).json({
      closestStore: closestStore.store,
      distance: distanceKm,
      charge: Math.round(shippingCharge),
      estimatedDelivery,
    });
  } catch (error) {
    console.error("Error calculating shipping details:", error);
    res.status(500).json({ message: "Internal server error while calculating shipping." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /nearbyStores
// ─────────────────────────────────────────────────────────────────────────────
const getNearbyStores = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50000, limit = 3 } = req.query;

    // Input validation
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "latitude and longitude query params are required." });
    }

    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ message: "latitude and longitude must be valid numbers." });
    }
    if (userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
      return res.status(400).json({ message: "latitude must be -90 to 90 and longitude must be -180 to 180." });
    }

    const maxDistanceKm = parseInt(maxDistance) / 1000;
    const storeLimit = Math.min(parseInt(limit) || 3, 20); // cap at 20

    // --- OPTIMIZATION: Bounding Box Query ---
    // 1 degree of latitude is roughly 111 km.
    // We multiply by 1.5 to match generous search radius logic.
    const searchRadiusKm = maxDistanceKm * 1.5;
    const latDelta = searchRadiusKm / 111;
    const lngDelta = searchRadiusKm / (111 * Math.cos(userLat * (Math.PI / 180)));

    const minLat = userLat - latDelta;
    const maxLat = userLat + latDelta;
    const minLng = userLng - lngDelta;
    const maxLng = userLng + lngDelta;

    // Only fetch stores within this square box!
    const allStores = await MapPlacesModel.find({
      "geo_location.latitude": { $gte: minLat, $lte: maxLat },
      "geo_location.longitude": { $gte: minLng, $lte: maxLng }
    });
    
    if (!allStores || allStores.length === 0) {
      return res.status(404).json({
        message: "No stores found in the database near this location.",
      });
    }

    // Calculate distance for each store (skip malformed docs)
    const storesWithDistance = [];
    for (const store of allStores) {
      try {
        if (
          !store.geo_location ||
          store.geo_location.latitude == null ||
          store.geo_location.longitude == null
        ) {
          console.warn(`Store "${store.name}" (${store._id}) is missing geo_location, skipping.`);
          continue;
        }

        const storeLat = parseFloat(store.geo_location.latitude);
        const storeLng = parseFloat(store.geo_location.longitude);
        if (isNaN(storeLat) || isNaN(storeLng)) {
          console.warn(`Store "${store.name}" has invalid coordinates, skipping.`);
          continue;
        }

        const distanceKm = calculateHaversineDistance(userLat, userLng, storeLat, storeLng);

        storesWithDistance.push({
          ...store.toObject(),
          distance: {
            meters: Math.round(distanceKm * 1000),
            kilometers: parseFloat(distanceKm.toFixed(2)),
          },
        });
      } catch (storeErr) {
        console.error(`Error processing store "${store.name}":`, storeErr.message);
        // continue to next store
      }
    }

    if (storesWithDistance.length === 0) {
      return res.status(404).json({
        message: "No stores with valid location data found.",
      });
    }

    // Pre-filter using straight-line distance to get candidates within a generous radius (e.g., 1.5x to account for winding roads)
    const candidateStores = storesWithDistance
      .filter((store) => store.distance.kilometers <= maxDistanceKm * 1.5)
      .sort((a, b) => a.distance.meters - b.distance.meters);

    if (candidateStores.length === 0) {
      return res.status(404).json({
        message: `No Ayatrio stores found within ${maxDistanceKm} km of your location. Try increasing the search radius.`,
        totalStores: storesWithDistance.length,
        closestStore: storesWithDistance.sort((a, b) => a.distance.meters - b.distance.meters)[0]?.name,
        closestDistance: storesWithDistance.sort((a, b) => a.distance.meters - b.distance.meters)[0]?.distance.kilometers,
      });
    }

    // Get exact driving distances for the top candidates
    // We cap to 25 to respect Google Maps Distance Matrix limits in a single request
    const exactCandidates = candidateStores.slice(0, 25);
    const destinations = exactCandidates.map(s => `${s.geo_location.latitude},${s.geo_location.longitude}`).join('|');

    if (process.env.GOOGLE_MAPS_API_KEY) {
      try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${userLat},${userLng}&destinations=${encodeURIComponent(destinations)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const response = await axios.get(url);

        if (response.data.status === "OK") {
          const elements = response.data.rows[0]?.elements || [];
          exactCandidates.forEach((store, index) => {
            const element = elements[index];
            if (element && element.status === "OK") {
              store.distance.meters = element.distance.value;
              store.distance.kilometers = parseFloat((element.distance.value / 1000).toFixed(2));
              store.distance.exactRoute = true; // Indicates we are using exact road distance
            }
          });
        }
      } catch (err) {
        console.error("Error fetching exact driving distance for nearby stores:", err.message);
      }
    }

    // Now filter exactly and sort by the real driving distance
    const nearbyStores = exactCandidates
      .filter((store) => store.distance.kilometers <= maxDistanceKm)
      .sort((a, b) => a.distance.meters - b.distance.meters)
      .slice(0, storeLimit);

    if (nearbyStores.length === 0) {
      return res.status(404).json({
        message: `No Ayatrio stores found within exact driving distance of ${maxDistanceKm} km. Try increasing the search radius.`,
        totalStores: storesWithDistance.length,
        closestStore: exactCandidates.sort((a, b) => a.distance.meters - b.distance.meters)[0]?.name,
        closestDistance: exactCandidates.sort((a, b) => a.distance.meters - b.distance.meters)[0]?.distance.kilometers,
      });
    }

    res.status(200).json(nearbyStores);
  } catch (error) {
    console.error("Error getting nearby stores:", error);
    res.status(500).json({ message: "Internal server error while finding nearby stores." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /directions
// ─────────────────────────────────────────────────────────────────────────────
const getDirections = async (req, res) => {
  try {
    const {
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      mode = "DRIVE",
    } = req.query;

    // Input validation
    if (!originLat || !originLng || !destinationLat || !destinationLng) {
      return res.status(400).json({
        message: "originLat, originLng, destinationLat, destinationLng are all required.",
      });
    }

    const oLat = parseFloat(originLat);
    const oLng = parseFloat(originLng);
    const dLat = parseFloat(destinationLat);
    const dLng = parseFloat(destinationLng);

    if (isNaN(oLat) || isNaN(oLng) || isNaN(dLat) || isNaN(dLng)) {
      return res.status(400).json({ message: "All coordinates must be valid numbers." });
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(503).json({
        message: "Google Maps API key is not configured on the server. Please set GOOGLE_MAPS_API_KEY in .env",
        fallbackUrl: `https://www.google.com/maps/dir/?api=1&origin=${oLat},${oLng}&destination=${dLat},${dLng}&travelmode=driving`,
      });
    }

    // Normalize mode to Routes API v2 enum
    const travelMode = normalizeTravelMode(mode);

    const url = `https://routes.googleapis.com/directions/v2:computeRoutes?key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const requestBody = {
      origin: {
        location: {
          latLng: { latitude: oLat, longitude: oLng },
        },
      },
      destination: {
        location: {
          latLng: { latitude: dLat, longitude: dLng },
        },
      },
      travelMode,
      // routingPreference only supported for DRIVE
      ...(travelMode === "DRIVE" && { routingPreference: "TRAFFIC_AWARE" }),
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false,
      },
    };

    const response = await axios.post(url, requestBody, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
      },
    });

    // Google Routes API v2 returns HTTP 200 with error in body on some failures
    if (response.data.error) {
      const googleErr = response.data.error;
      console.error("Google Routes API error:", googleErr);

      const statusCode = googleErr.code || 500;
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&origin=${oLat},${oLng}&destination=${dLat},${dLng}&travelmode=driving`;

      if (statusCode === 403) {
        return res.status(403).json({
          message: "Google Maps API request denied. Check your API key and that Routes API is enabled.",
          fallbackUrl,
        });
      }
      if (statusCode === 429) {
        return res.status(429).json({
          message: "Google Maps API quota exceeded. Please try again later.",
          fallbackUrl,
        });
      }
      return res.status(500).json({
        message: googleErr.message || "Google Routes API returned an error.",
        fallbackUrl,
      });
    }

    if (!response.data.routes || response.data.routes.length === 0) {
      return res.status(404).json({
        message: "No route found between the specified locations.",
        fallbackUrl: `https://www.google.com/maps/dir/?api=1&origin=${oLat},${oLng}&destination=${dLat},${dLng}&travelmode=driving`,
      });
    }

    const route = response.data.routes[0];

    // duration comes back as "1234s" (string) — strip the trailing "s"
    const durationSeconds =
      typeof route.duration === "string"
        ? parseInt(route.duration.replace(/[^0-9]/g, ""), 10)
        : parseInt(route.duration, 10);

    res.status(200).json({
      status: "OK",
      route: {
        distance: {
          text: `${(route.distanceMeters / 1000).toFixed(1)} km`,
          value: route.distanceMeters,
        },
        duration: {
          text: formatDuration(durationSeconds),
          value: durationSeconds,
        },
        polyline: route.polyline?.encodedPolyline || null,
      },
      fallbackUrl: `https://www.google.com/maps/dir/?api=1&origin=${oLat},${oLng}&destination=${dLat},${dLng}&travelmode=driving`,
    });
  } catch (error) {
    console.error("Error getting directions:", error.message);

    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&origin=${req.query.originLat},${req.query.originLng}&destination=${req.query.destinationLat},${req.query.destinationLng}&travelmode=driving`;

    // Axios HTTP error from Google
    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        return res.status(403).json({
          message: "Google Maps API key is invalid or the Routes API is not enabled for this project.",
          fallbackUrl,
        });
      }
      if (status === 429) {
        return res.status(429).json({
          message: "Google Maps API quota exceeded. Please try again later.",
          fallbackUrl,
        });
      }
      return res.status(status).json({
        message: error.response.data?.error?.message || "Google Maps API error.",
        fallbackUrl,
      });
    }

    // Network error or timeout
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return res.status(503).json({
        message: "Unable to reach Google Maps API. Check your server's internet connection.",
        fallbackUrl,
      });
    }

    res.status(500).json({
      message: "Internal server error while calculating directions.",
      fallbackUrl,
    });
  }
};

module.exports = {
  getMapPlaces,
  createMapPlaces,
  deleteMapPlaces,
  getDistance,
  searchMapStore,
  calculateShippingDetails,
  getNearbyStores,
  getDirections,
};