const demandTypeDB = require("../model/DemandType");
const productsDB = require("../model/Products");

exports.createDemandType = async (req, res) => {
  try {
    const { type } = req.body;
    const demandType = await demandTypeDB.findOne({ type });
    if (demandType) {
      return res.status(400).json({ message: "Demand Type already exists." });
    }
    const newDemandType = new demandTypeDB({ type });
    await newDemandType.save();

    res
      .status(201)
      .json({ message: "Demand Type created successfully.", newDemandType });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.addProductToDemandType = async (req, res) => {
  try {
    const { productId, demandtype } = req.body;

    if (!productId || !demandtype) {
      return res
        .status(400)
        .json({ error: "Product ID or demand type is missing." });
    }

    const demandType = await demandTypeDB.findOne({
      demandtype: { $regex: new RegExp(demandtype, "i") },
    });

    if (!demandType) {
      return res.status(404).json({ error: "Demand type not found." });
    }

    const updatedProduct = await productsDB.findOneAndUpdate(
      { _id: productId },
      { demandtype },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error while updating demand type:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating demand type." });
  }
};

exports.getAllDemandTypes = async (req, res) => {
  try {
    const demandTypes = await demandTypeDB.find().select("type");
    res.status(200).send(demandTypes);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.removeProductFromDemandType = async (req, res) => {
  try {
    const { type, productId } = req.body;
    const demandType = await demandTypeDB.findOne({
      type: { $regex: new RegExp(type, "i") },
    });
    if (!demandType) {
      return res.status(404).json({ message: "Demand Type not found." });
    }
    const product = await productsDB.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    product.demandtype = null;
    await product.save();
    res.status(200).json({ message: "Product removed from Demand Type." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.deleteDemandType = async (req, res) => {
  try {
    const { type } = req.params;
    console.log(type);
    const demandType = await demandTypeDB.findOne({
      type: { $regex: new RegExp(type, "i") },
    });

    if (!demandType) {
      return res.status(404).json({ message: "Demand Type not found." });
    }
    const product = await productsDB.find({
      demandtype: { $regex: new RegExp(type, "i") },
    });
    product.forEach(async (product) => {
      product.demandtype = null;
      await product.save();
    });

    await demandType.deleteOne();

    res.status(200).json({ message: "Demand Type deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
