const LiveRoomAdmin = require("../model/LiveRoomAdmin");
const User = require("../model/User");

// POST: '/api/liveRoomAdmin'
exports.createLiveRoomAdmin = async (req, res) => {
  try {
    const { name, email, topic } = req.body;

    const user = await User.findOneAndUpdate(
      { email: email },
      {
        $set: {
          "liveStreamDetails.isLiveStreamHost": true,
          "liveStreamDetails.topic": topic,
        },
      }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    await user.save();

    const liveRoomAdmin = new LiveRoomAdmin({
      name,
      email,
      topic,
    });
    await liveRoomAdmin.save();
    res.status(201).json({ message: "Live room admin added successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET: '/api/liveRoomAdmin'
exports.getLiveRoomAdmins = async (req, res) => {
  try {
    const info = await LiveRoomAdmin.find();
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET: '/api/liveRoomAdmin/:id'
exports.getLiveRoomAdminById = async (req, res) => {
  const { id } = req.params;

  try {
    const info = await LiveRoomAdmin.findOne({ _id: id });
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE: '/api/liveRoomAdmin/:id'
exports.deleteLiveRoomAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const liveRoomAdmin = await LiveRoomAdmin.findOne({ _id: id });

    await User.updateOne(
      { email: liveRoomAdmin.email },
      {
        $set: {
          "liveStreamDetails.isLiveStreamHost": false,
          "liveStreamDetails.topic": "",
        },
      }
    );

    await LiveRoomAdmin.deleteOne({ _id: id });
    res.status(200).json({ message: "Live room admin deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH: '/api/liveRoomAdmin/:id'
exports.updateLiveRoomAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, topic } = req.body;

  try {
    const liveRoomAdmin = await LiveRoomAdmin.findOneAndUpdate(
      { _id: id },
      { name, topic }
    );

    await User.updateOne(
      { email: liveRoomAdmin.email },
      {
        $set: {
          "liveStreamDetails.topic": topic,
        },
      }
    );

    res.status(200).json({ message: "Live room admin updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET: `/api/getLiveRoomAdminByEmail/:email`
exports.getLiveRoomAdminByEmail = async (req, res) => {
  const { email } = req.params;

  try {
    const info = await LiveRoomAdmin.findOne({ email: email });
    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
