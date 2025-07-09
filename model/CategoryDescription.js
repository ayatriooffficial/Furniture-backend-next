const mongoose = require("mongoose");

const CategoryDescriptionSchema = new mongoose.Schema({
    imgSrc: { type: String },
    category: { type: String },
    imgTitle: { type: String },
    circles: [{
        type: {
            productTitle: String,
            productCategory: String,
            price: Number,
            topPosition: Number,
            leftPosition: Number,
            productLink: String
        }
    }],
    personReview: [{
        type: {
            title: String,
            profileImg: String,
            review: String,
            linkedln: String,
            occupation: String,
            extra: String
        }
    }],
});

module.exports = CategoryDescriptionDB = mongoose.model("CategoryDescription", CategoryDescriptionSchema);
