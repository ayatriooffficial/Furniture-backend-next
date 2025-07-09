const mongoose = require("mongoose");

const profileContentSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
});

const ProfileContent = mongoose.model("ProfileContent", profileContentSchema);
module.exports = ProfileContent;
