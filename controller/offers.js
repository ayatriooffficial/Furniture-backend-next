const offerDb = require("../model/Offers");
const productDb = require("../model/Products");
const categoryDb = require("../model/Category");
const ExternalOffer = require("../model/ExternalOffer");
const userdb = require("../model/User");
const purchasedb = require("../model/Purchase");

exports.createGlobalOffer = async (req, res) => {
  try {
    const {
      name,
      type,
      percentageOff,
      startDate,
      endDate,
      description,
      metadata,
      chunkSize,
    } = req.body;

    const newOffer = new offerDb({
      name,
      type,
      percentageOff,
      startDate,
      endDate,
      description,
      metadata,
      chunkSize,
    });

    await newOffer.save();

    res
      .status(201)
      .json({ message: "Global offer created successfully", offer: newOffer });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.getBankOffers = async (req, res) => {
  try {
    const currentDate = new Date();
    const bankOffers = await ExternalOffer.find({
      type: "bank",
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    formattedBankOffers = bankOffers.map((offer) => ({
      description: offer.description,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      minimumPurchase: offer.minimumPurchase,
      bankId: offer.name,
      title: offer.metadata.title,
    }));

    return res.status(200).json({ bankOffers: formattedBankOffers });
  } catch (error) {
    console.log("Error in getting bank offers", error.message);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

exports.getExternalOffers = async (req, res) => {
  try {
    const currentDate = new Date();
    const extOffers = await ExternalOffer.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    formattedExtOffers = extOffers.map((offer) => ({
      description: offer.description,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      minimumPurchase: offer.minimumPurchase,
      name: offer.name,
      title: offer.metadata.title,
    }));

    return res.status(200).json({ externalOffers: formattedExtOffers });
  } catch (error) {
    console.log("Error in getting external offers", error.message);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

exports.getExternalOfferApplicablePrice = async (req, res) => {
  try {
    //NOTE this amount does not include delivery price
    //this request by client side should only be made when user ihas logged in
    const { userId, amount } = req.params;

    console.log("Inside offers");

    if (!userId || !amount)
      return res
        .status(400)
        .json({ message: "Incomplete data. Please provide userId and amount" });

    //look for this user
    const user = await userdb.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });


    const purchases = await purchasedb.find({ userId: userId });
    //check how many purchases they have already made
    const numPurchases = purchases.length;
    const data = {
      amount,
      message: "No offer applicable",
      discountedAmount: 0,
    };

    //user has made his secodn purchase, no offer successful
    if (numPurchases >= 2) {
      return res.status(200).json(data);
    }

    //now we can fetch the external offers and their details from mongodb
    const externalOffers = await ExternalOffer.find();
    let applicableOffer = null;

    //check if first purchase offer could be applied
    if (numPurchases === 0) {
      //Provide first purchase discount
      //( if amount > offer.minimumPurchase )
      applicableOffer = externalOffers.find(
        (offer) => offer.type === "firstPurchase"
      );
    }
    //check if second purchase offer could be applied
    else if (numPurchases === 1) {
      //Provide second purchase discount
      applicableOffer = externalOffers.find(
        (offer) => offer.type === "secondPurchase"
      );
    }

    //Overall Logic for First or Second Purchase
    //check Dates
    const currentDate = new Date();
    const endDate = new Date(applicableOffer.endDate);
    const startDate = new Date(applicableOffer.startDate);

    //CONDITIONS
    const isAmtGreaterThanMinPurchase =
      +applicableOffer.minimumPurchase <= data.amount;
    const isPeriodApplicable = startDate < currentDate && currentDate < endDate;

    if (!isAmtGreaterThanMinPurchase || !isPeriodApplicable)
      return res.status(200).json(data);

    data.message = `${applicableOffer.name} Offer Applied`;
    // types are ['percentage', 'fixed']
    if (applicableOffer.discountType === "percentage") {
      data.amount -= (amount * applicableOffer.discountValue) / 100;
      data.discountedAmount = (amount * applicableOffer.discountValue) / 100;
    } else if (applicableOffer.discountType === "fixed") {
      data.amount = amount - applicableOffer.discountValue;
      data.discountedAmount = applicableOffer.discountValue;
    }

    return res.status(200).json(data);
  } catch (error) {
    console.log(
      "Error in calculating external offer applicable price",
      error.message
    );
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.createExternalOffer = async (req, res) => {
  try {
    const {
      name,
      type,
      discountType,
      discountValue,
      minimumPurchase,
      startDate,
      endDate,
      description,
      metadata,
    } = req.body;

    const newOffer = new ExternalOffer({
      name,
      type,
      discountType,
      discountValue,
      minimumPurchase,
      startDate,
      endDate,
      description,
      metadata,
    });

    await newOffer.save();

    res.status(201).json({
      message: "External offer created successfully",
      offer: newOffer,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.getAllExternalOffers = async (req, res) => {
  try {
    const externalOffers = await ExternalOffer.find();
    res.status(200).send(externalOffers);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.getExternalOffer = async (req, res) => {
  const { id } = req.params;

  try {
    const offer = await ExternalOffer.findById(id);

    if (!offer) {
      return res.status(404).json({ message: "External offer not found." });
    }

    res.status(200).send(offer);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.addProductToOffer = async (req, res) => {
  try {
    const { type, productId } = req.body;
    const offer = await offerDb.findOne({
      type: type,
    });
    if (!offer) {
      return res.status(404).json({ message: "Offer not found." });
    }
    const product = await productDb.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    product.discountedprice.price =
      product.perUnitPrice - (product.perUnitPrice * offer.percentageOff) / 100;

    product.discountedprice.startDate = offer.startDate;
    product.discountedprice.endDate = offer.endDate;
    product.discountedprice.chunkSize = offer.chunkSize;
    product.offer = type;

    await product.save();
    res.status(200).json({ message: "Product added to Offer." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.getOffer = async (req, res) => {
  const { type } = req.query;

  try {
    const offer = await offerDb.findOne({
      type: (type?.replace(/%20/g, " ") || "").trim(),
    });

    if (!offer) {
      return res.status(404).json({ message: "Offer not found." });
    }

    res.status(200).send(offer);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// exports.getAllProductsByOffer = async (req, res) => {
//   try {
//     const { type } = req.params;
//     if (!type) return res.status(400).json({ message: "Please provide type." });

//     const offer = await offerDb.findOne({
//       type: { $regex: new RegExp(type, "i") },
//     });
//     if (!offer) {
//       return res.status(404).json({ message: "Offer not found." });
//     }

//     const products = await productDb.find({
//       offer: { $regex: new RegExp(type, "i") },
//     });
//     res.status(200).send(products);
//   } catch (error) {
//     res.status(500).json({ error: error.message || "Internal server error" });
//   }
// };

exports.getAllOffers = async (req, res) => {
  try {
    const offers = await offerDb.find();
    res.status(200).send(offers);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.removeProductFromOffer = async (req, res) => {
  try {
    const { type, productId } = req.body;
    const offer = await offerDb.findOne({
      type: { $regex: new RegExp(type, "i") },
    });
    if (!offer) {
      return res.status(404).json({ message: "Offer not found." });
    }
    const product = await productDb.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    product.discountedprice = null;
    product.offer = null;
    await product.save();
    res.status(200).json({ message: "Product removed from Offer." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const { type } = req.params;
    const offer = await offerDb.findOne({
      type,
    });
    if (!offer) {
      return res.status(404).json({ message: "Offer not found." });
    }
    const product = await productDb.find({
      offer: type,
    });
    product.forEach(async (product) => {
      product.discountedprice = null;
      product.offer = null;
      await product.save();
    });

    await offer.deleteOne();
    res.status(200).json({ message: "Offer deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.getAllCategoryByOffer = async (req, res) => {
  try {
    const { type } = req.params;
    if (!type) return res.status(400).json({ message: "Please provide type." });
    const offer = await offerDb.findOne({
      type,
    });
    if (!offer) {
      return res.status(404).json({ message: "Offer not found." });
    }

    const products = await productDb.find({
      offer: type,
    });
    const categories = products.map((product) => product.category);
    const uniqueCategories = [...new Set(categories)];
    let category = [];

    for (let i = 0; i < uniqueCategories.length; i++) {
      const categoryData = await categoryDb
        .findOne({
          name: uniqueCategories[i],
        })
        .select("name image");
      category.push(categoryData);
    }

    res.status(200).send(category);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
