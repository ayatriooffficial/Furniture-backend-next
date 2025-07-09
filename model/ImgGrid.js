const mongoose = require("mongoose");

const imgCircle = new mongoose.Schema({
    productTitle: String,
    productCategory: String,
    price: Number,
    topPosition:Number,
    leftPosition:Number,
    productLink:String
})
const ImgGridSchema = new mongoose.Schema({
    img: { type: [String] },
    category:String,
    circles: { type: [imgCircle] },
})


module.exports = ImgGridDB = mongoose.model("ImgGrid", ImgGridSchema);

