const mongoose = require("mongoose");

const requestedProductSchema = new mongoose.Schema({
    // productId: { type: String, required: true, unique: true },
    productObjectId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
    },
    price : {
        type: Number,
    },
    status : {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
        required: true,
    },
    address : {
        type: String,
    },
    requestedBy : {
        type: String,
    },
    requestedByEmail : {
        type: String,
    },
});
const requestedProduct = mongoose.model("RequestedProduct", requestedProductSchema);
module.exports = requestedProduct;
