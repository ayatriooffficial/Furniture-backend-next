const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    isAdmin: { type: Boolean, default: true },
    username: { type: String, required: true },
    password: { type: String, required: true }
});

module.exports = adminDB = mongoose.model("admin", adminSchema);