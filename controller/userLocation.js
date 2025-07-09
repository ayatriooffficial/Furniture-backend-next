const UserLocation = require("../model/UserLocation");

// POST: '/api/userLocation'
exports.createUserLocation = async (req, res) => {
  try {
    const { deviceId, lat, lng, pincode } = req.body;
    const userLocation = new UserLocation({
      deviceId,
      lat,
      lng,
      pincode,
    });
    await userLocation.save();
    res.status(201).json({ message: "User location added successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET: '/api/userLocation'
exports.getUserLocations = async (req, res) => {
  try {
    const info = await UserLocation.find();
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET: '/api/userLocation/:deviceId'
exports.getUserLocationByDeviceId = async (req, res) => {
  const { deviceId } = req.params;

  try {
    const info = await UserLocation.findOne({ deviceId: deviceId });
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH: '/api/userLocation/:deviceId'
exports.updateUserLocation = async (req, res) => {
  const { deviceId } = req.params;
  const { lat, lng, pincode } = req.body;

  try {
    const info = await UserLocation.findOneAndUpdate(
      { deviceId: deviceId },
      { lat, lng, pincode },
      { new: true, upsert: true }
    );
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE: '/api/userLocation/:deviceId'
exports.deleteUserLocation = async (req, res) => {
  const { deviceId } = req.params;

  try {
    await UserLocation.findOneAndDelete({ deviceId: deviceId });
    res.status(200).json({ message: "User location deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
