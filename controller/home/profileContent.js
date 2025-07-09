const ProfileContentDb = require("../../model/ProfileContent");
const userdb = require("../../model/User");

const getProfileContent = async (req, res) => {
  try {
    const profileContent = await ProfileContentDb.find().populate("user");
    console.log(profileContent);
    res.json(profileContent);
  } catch (error) {
    console.log(error)
    res.json({ message: error });
  }
};
const createProfileContent = async (req, res) => {
  try {
    // const imageUrl = req.files
    //   .filter((file) => file.fieldname === 'image')
    //   .map((file) => file.location);

    const { email } = req.body;

    const user = await userdb.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profileInfo = new ProfileContentDb({
      user: user._id,
    });
    await profileInfo.save();
    res.json({ message: "Team Memeber saved successfully! " });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteProfileById = async (req, res) => {
  const profileId = req.params.profileId;

  try {
    // Assuming YourModel is your Mongoose model representing the slider circles
    const result = await ProfileContentDb.findOneAndDelete({ _id: profileId });

    if (!result) {
      return res.status(404).json({ message: "profile not found" });
    }

    // Fetch updated data after deletion
    const updatedData = await ProfileContentDb.find();

    res.json(updatedData);
  } catch (error) {
    console.error("Error deleting profiles section:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getProfileContent, createProfileContent, deleteProfileById };
