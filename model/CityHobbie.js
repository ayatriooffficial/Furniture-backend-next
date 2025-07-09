const mongoose = require("mongoose");

const CitySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    img: String,
});

const HobbySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    img: String,
});

const CitiesHobbiesSchema = mongoose.Schema({
    cities: [CitySchema],
    hobbies: [HobbySchema],
});

const CitiesHobbies = mongoose.model("CitiesHobbies", CitiesHobbiesSchema);

module.exports = CitiesHobbies;
