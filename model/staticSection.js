const mongoose = require("mongoose");

const staticSectionSchema = new mongoose.Schema({
    title:{
        type:String,
    },
    icon:{
        type:String,
    },
    desc:{
        type:String,
    },
    img:[String]
});

const StaticSection = mongoose.model("StaticSection", staticSectionSchema);
module.exports = StaticSection;