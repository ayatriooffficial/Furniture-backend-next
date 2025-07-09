const mongoose = require("mongoose");

// const CategorySchema = mongoose.Schema({
//     name: { type: String, required: true },
//     subcategories: { type: [String] }
// });

const PreferencesSchema = mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    recommendedProducts: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products' // Reference to the Product collection
        }]
    }
});

const preferencesDB = mongoose.model("preferences", PreferencesSchema);

module.exports = preferencesDB;
