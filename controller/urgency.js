const Product = require("../model/Products");
const Urgency = require("../model/Urgency");

exports.createUrgency = async (req, res) => {
  try {
    const { type } = req.body;
    const urgency = await Urgency.findOne({
      type: type,
    });
    if (urgency) {
      return res.status(400).json({ message: "Urgency already exists." });
    }

    const newUrgency = new Urgency({
      type,
    });

    await newUrgency.save();

    res
      .status(201)
      .json({ message: "Urgency created successfully.", newUrgency });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.getUrgencies = async (req, res) => {
  try {
    const urgencies = await Urgency.find();
    res.status(200).json( urgencies );
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.getUrgency = async (req, res) => {
  try {
    const { type } = req.params;
    const urgency = await Urgency.findOne({ type: type });
    if (!urgency) {
      return res.status(404).json({ message: "Urgency not found." });
    }
    res.status(200).json({ urgency });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.deleteUrgency = async (req, res) => {
  try {
    const { type } = req.params;
    const urgency = await Urgency.findOne({ type: type });
    if (!urgency) {
      return res.status(404).json({ message: "Urgency not found." });
    }
    const products = await Product.find({ urgency: type });
    products.map(async (product) => {
      product.urgency = null;
      await product.save();
    });
    await urgency.deleteOne();
    res.status(200).json({ message: "Urgency deleted successfully." });
  } catch (error) {
    // console.log(error)
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.addUrgencyToProduct = async (req, res) => {
  try {
    const { type, productId } = req.body;
    const urgency = await Urgency.findOne({ type: type });
    if (!urgency) {
      return res.status(404).json({ message: "Urgency not found." });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    product.urgency = type;
    await product.save();
    res.status(200).json({ message: "Urgency added to product." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
