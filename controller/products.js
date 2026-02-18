const productsDB = require("../model/Products");
const roomDB = require("../model/room");
const reviewDb = require("../model/review");
const { v4: uuidv4 } = require("uuid");
const demandTypeDB = require("../model/DemandType");
const SpecialReview = require("../model/SpecialReview");
const RequestedProduct = require("../model/RequestedProduct");
const { sendEmailForProductRequest } = require("./sendmail");
const UserDB = require("../model/User");
const Offer = require("../model/Offers");
const categoriesDB = require("../model/Category");
const pdf = require("html-pdf-node");
const mongoose = require("mongoose");
// const puppeteer = require("puppeteer");
// POST: api/createProduct

const safeJSONParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error("JSON parsing error:", error);
    return null;
  }
};

exports.createProduct = async (req, res) => {
  try {
    // Extract image URLs from request body
    const {
      imageUrls = [],
      colorImageUrls = [],
      featureImageUrls = [],
      coreValueImageUrls = [],
    } = req.body;

    // console.log('Provided Image URLs:', {
    //   mainImages: imageUrls,
    //   colorImages: colorImageUrls,
    //   featuresImages: featureImageUrls,
    //   coreValuesImages: coreValueImageUrls
    // });

    if (!req.body) {
      // console.log('Request rejected - Missing product data');
      return res.status(406).send("Please provide product data");
    }

    // Destructure and log important fields
    const {
      title,
      patternNumber,
      room,
      shortDescription,
      color,
      designStyle,
      category,
      subCategory,
      discountedprice,
      demandtype,
      specialprice,
      perUnitType,
      perUnitPrice,
      dimensions,
      purchaseMode,
      otherRoom,
      productDescription,
      coreValueIds = [],
      colors = [],
      featureIds = [],
      material,
      productType,
      availability,
      availabilityTime,
      isFreeSampleAvailable,
      isFreeShippingAvailable,
      isOnlySoldInStore,
      expectedDelivery,
      authorId,
      offer,
      urgency,
      faqs,
    } = req.body;

    // console.log('Important Product Fields:', JSON.stringify({
    //   title,
    //   patternNumber,
    //   room,
    //   shortDescription: shortDescription?.substring(0, 50) + (shortDescription?.length > 50 ? '...' : ''),
    //   color,
    //   category,
    //   subCategory,
    //   productType,
    //   authorId,
    //   offer
    // }, null, 2));

    // Process external offers
    let mappedExternalOffers = [];
    if (req.body.externalOffers) {
      try {
        // console.log('Processing External Offers:', req.body.externalOffers);
        let offersData = req.body.externalOffers;
        let parsedOffers;
        if (typeof offersData === "string") {
          offersData = offersData
            .replace(/\[\n'\s+'/g, "[")
            .replace(/\s+\+\s+'/g, "")
            .replace(/'\s+\+\s+'/g, "")
            .replace(/\\n/g, "")
            .replace(/\\/g, "")
            .replace(/"\[/g, "[")
            .replace(/\]"/g, "]")
            .replace(/'/g, '"')
            .replace(/\s+/g, " ")
            .trim();

          // console.log('Cleaned Offers String:', offersData);
          parsedOffers = JSON.parse(offersData);
        } else {
          parsedOffers = offersData;
        }

        if (!Array.isArray(parsedOffers)) {
          parsedOffers = [parsedOffers];
        }

        mappedExternalOffers = parsedOffers.map((offer) => ({
          offerId: new mongoose.Types.ObjectId(offer.offerId),
          name: offer.name,
          type: offer.type,
          discountType: offer.discountType,
          discountValue: Number(offer.discountValue),
          minimumPurchase: Number(offer.minimumPurchase),
          startDate: new Date(offer.startDate),
          endDate: new Date(offer.endDate),
          description: offer.description,
        }));

        // console.log('Final Mapped Offers:', JSON.stringify(mappedExternalOffers, null, 2));
      } catch (error) {
        console.error("Offer Processing Error:", {
          message: error.message,
          rawOffers: req.body.externalOffers,
          stack: error.stack,
        });
        throw new Error(`Failed to process external offers: ${error.message}`);
      }
    }

    // Map colors with images
    const mappedColors = colors.map((color, index) => ({
      color: color,
      images: colorImageUrls.slice(index * 4, index * 4 + 4),
    }));

    if (color && imageUrls.length > 0) {
      mappedColors.unshift({
        color: color,
        images: imageUrls,
      });
    }

    // console.log('Mapped Color Data:', JSON.stringify({
    //   colorCount: mappedColors.length,
    //   firstColor: mappedColors[0]?.color,
    //   totalImages: mappedColors.flatMap(c => c.images).length
    // }, null, 2));

    const validatedFeatureIds = Array.isArray(featureIds)
      ? featureIds
      : typeof featureIds === "string"
        ? featureIds.split(",").filter((id) => id.trim())
        : [];

    // Process coreValueIds - now expects an object { key: value }
    let validatedCoreValueIds = {};
    if (
      coreValueIds &&
      typeof coreValueIds === "object" &&
      !Array.isArray(coreValueIds)
    ) {
      // New format: object with key-value pairs
      validatedCoreValueIds = coreValueIds;
    } else if (Array.isArray(coreValueIds)) {
      // Backward compatibility: convert array to object with null values
      validatedCoreValueIds = coreValueIds.reduce((acc, id) => {
        acc[id] = null;
        return acc;
      }, {});
    } else if (typeof coreValueIds === "string") {
      // Handle comma-separated string (legacy support)
      const ids = coreValueIds.split(",").filter((id) => id.trim());
      validatedCoreValueIds = ids.reduce((acc, id) => {
        acc[id] = null;
        return acc;
      }, {});
    }

    // Process dimensions
    const structuredDimensions = dimensions?.map((dimension) => ({
      dimension: dimension.dimension,
      price: dimension.price,
      discountedprice: dimension.discountedprice || null,
    }));

    // Fetch author data
    let author = null;
    if (authorId) {
      // console.log(`Fetching author data for ID: ${authorId}`);
      author = await UserDB.findById(authorId);
      // console.log(`Author found: ${author ? author._id : 'Not found'}`);
    }

    // Process pricing and offers
    let mappedDiscountPrice = {
      price: null,
      startDate: null,
      endDate: null,
      chunkSize: null,
    };

    let offerType = null;
    if (offer && discountedprice) {
      // console.log(`Processing offer: ${offer} with price ${discountedprice}`);
      const offerData = await Offer.findOne({ type: offer });
      if (offerData) {
        mappedDiscountPrice = {
          price: discountedprice,
          startDate: offerData.startDate,
          endDate: offerData.endDate,
          chunkSize: offerData.chunkSize,
        };
        offerType = offerData.type;
        // console.log(`Applied offer: ${offerType}`, mappedDiscountPrice);
      }
    }

    // Validate category
    // console.log(`Validating category: ${category} > ${subCategory}`);
    const categoryData = await categoriesDB
      .findOne({ name: category })
      .select("subcategories");
    if (!categoryData) {
      console.error(`Category not found: ${category}`);
      return res.status(404).json({ message: "Category not found" });
    }

    const subCategoryData = categoryData.subcategories.find(
      (sub) => sub.name === subCategory,
    );

    // Create product document
    const newProduct = new productsDB({
      productTitle: title,
      productId: patternNumber,
      patternNumber,
      roomCategory: room,
      category,
      subcategory: subCategory,
      isAccessories: subCategoryData?.isAccessories || false,
      type: designStyle,
      shortDescription,
      images: imageUrls,
      perUnitPrice,
      colors: color ? [color] : [],
      productImages: mappedColors,
      dimensions: structuredDimensions,
      unitType: perUnitType,
      discountedprice: mappedDiscountPrice,
      specialprice,
      demandtype,
      purchaseMode,
      otherRoom,
      productDescription,
      coreValueIds: validatedCoreValueIds,
      featureIds: validatedFeatureIds,
      material,
      productType,
      availability,
      availabilityTime,
      isFreeSampleAvailable,
      isFreeShippingAvailable,
      isOnlySoldInStore,
      expectedDelivery,
      author: author?._id,
      offer: offerType,
      urgency,
      externalOffers: mappedExternalOffers,
      faqs: faqs || [],
    });

    console.log("✅ BEFORE SAVING TO DB:");
    console.log("Product coreValueIds:", newProduct.coreValueIds);
    console.log("Product featureIds:", newProduct.featureIds);

    // console.log('Final Product Document:', JSON.stringify({
    //   ...newProduct.toObject(),
    //   // Omit large arrays for readability
    //   productImages: ['...truncated...'],
    //   dimensions: ['...truncated...'],
    //   features: ['...truncated...'],
    //   coreValues: ['...truncated...']
    // }, null, 2));

    await newProduct.save();

    res.status(201).json({ message: "New Product created successfully!" });
  } catch (error) {
    // console.error('Product Creation Error:', {
    //   message: error.message,
    //   stack: error.stack,
    //   requestBody: JSON.stringify(req.body, null, 2),
    //   timestamp: new Date().toISOString()
    // });
    res.status(500).json({
      error: "Error while creating new product",
      message: error.message,
    });
  }
};

// GET  '/api/products'
exports.fetchAllProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 16;
  const skip = (page - 1) * limit;

  let query = productsDB.find({});
  // Search functionality
  const search = req.query.search;
  // Add search functionality for demandtype and offers
  if (search) {
    query = query.find({
      $or: [
        { productTitle: { $regex: new RegExp(search, "i") } },
        { category: { $regex: new RegExp(search, "i") } },
        { roomCategory: { $regex: new RegExp(search, "i") } },
        { subcategory: { $regex: new RegExp(search, "i") } },
        { colors: { $regex: new RegExp(search, "i") } },
        { demandtype: { $regex: new RegExp(search, "i") } },
        { offer: { $regex: new RegExp(search, "i") } },
      ],
    });
  }

  // Filter by category (standalone)
  if (req.query.category) {
    query = query.find({ category: req.query.category });
  }

  // Filter by roomCategory (standalone)
  if (req.query.roomCategory) {
    query = query.find({ roomCategory: req.query.roomCategory });
  }

  // Filter by demandtype (standalone)

  if (req.query.demandtype) {
    query = query.find({ demandtype: req.query.demandtype });
  }

  // Filter by offer (standalone)
  if (req.query.offer) {
    query = query.find({ offer: req.query.offer });
  }

  // Filter by category and colors (combination)  -> for dropdown
  if (req.query.category && req.query.colors) {
    query = query.find({
      category: req.query.category,
      colors: { $regex: new RegExp(req.query.colors, "i") },
    });
  }

  // Filter by category and roomCategory (combination)  -> for dropdown
  if (req.query.category && req.query.roomCategory) {
    query = query.find({
      category: req.query.category,
      roomCategory: req.query.roomCategory,
    });
  }

  // Filter by category and collection (combination)  -> for dropdown
  if (req.query.category && req.query.collections) {
    query = query.find({
      category: req.query.category,
      collectionName: req.query.collections,
    });
  }

  // Filter by category and style (combination)  -> for dropdown
  if (req.query.category && req.query.style) {
    query = query.find({
      category: req.query.category,
      style: req.query.style,
    });
  }

  // Sorting
  if (req.query._sort && req.query._order) {
    query = query.sort({ [req.query._sort]: req.query._order });
  }

  try {
    const docs = await query.skip(skip).limit(limit).exec();
    res.status(200).json(docs);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.fetchProductByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is missing." });
    }

    const product = await productsDB
      .findOne({ productId: productId })
      .populate("author")
      .populate("ratings");

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.status(200).json(product);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.fetchProductsByCategoryAndSubCategory = async (req, res) => {
  const { category, subcategory, page, itemsPerPage } = req.query;
  if (!category || !subcategory) {
    return res
      .status(400)
      .json({ error: "Category or subCategory is missing." });
  }

  if (page && itemsPerPage) {
    // console.log("this run");
    try {
      const skip = (page - 1) * itemsPerPage;
      const products = await productsDB
        .find({
          category,
          subcategory,
          isAccessories: false,
        })
        .populate("author")
        .skip(skip)
        .limit(itemsPerPage);

      const Totalproducts = await productsDB.find({
        category: category,
        subcategory: subcategory,
      });
      return res
        .status(200)
        .json({ products: products, totalproducts: Totalproducts.length });
    } catch (error) {
      console.error(
        "Error while fetching products by category and subCategory:",
        error,
      );
      return res.status(500).json({
        error:
          "An error occurred while fetching products by category and subCategory.",
      });
    }
  }

  try {
    const products = await productsDB
      .find({
        category,
        subcategory,
        isAccessories: false,
      })
      .populate("author")
      .sort({ popularity: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error(
      "Error while fetching products by category and subCategory:",
      error,
    );
    res.status(500).json({
      error:
        "An error occurred while fetching products by category and subCategory.",
    });
  }
};

// fetch particular product
exports.fetchProductByTitle = async (req, res) => {
  try {
    let { title } = req.query;
    const product = await productsDB
      .findOne({ productTitle: title })
      .populate("author")
      .populate("ratings");

    res.status(201).send(product);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.fetchProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productsDB.findById(id);
    res.status(201).send(product);
  } catch (error) {
    res.status(500).send(error);
  }
};

// delete particular product by ID
exports.deleteProductById = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Check if the provided ID is valid
    if (!productId) {
      return res.status(400).json({ error: "Product ID is missing." });
    }

    const deletedProduct = await productsDB.findByIdAndDelete({
      _id: productId,
    });

    const rooms = roomDB.find({ productObjectId: productId });
    if (rooms) {
      await roomDB.deleteMany({ productObjectId: productId });
    }

    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }

    const updatedData = await productsDB.find();

    res.status(200).json(updatedData);
  } catch (error) {
    console.error("Error while deleting product:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the product." });
  }
};

// GET:  '/api/productsbyroomType'
exports.fetchProductsByRoomType = async (req, res) => {
  const { roomType } = req.query;

  if (!roomType) {
    return res.status(400).json({ error: "Room type is missing." });
  }

  try {
    const products = await productsDB
      .find({
        roomCategory: { $in: [roomType] },
        isAccessories: false,
      })
      .populate("author")
      .sort({ popularity: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error while fetching products by room type:", error);
    res.status(500).json({
      error: "An error occurred while fetching products by room type.",
    });
  }
};

//------------------reviw endpoints

exports.createReview = async (req, res) => {
  try {
    const imageUrls = req.files
      ?.filter((file) => file.fieldname === "image")
      .map((file) => file.location);

    const reviewId = uuidv4();

    const {
      productId,
      name,
      userEmail,
      rating,
      comment,
      profilePic,
      userId,
      dynamicRatings,
    } = req.body;

    // const product = await productsDB.findById(productId).populate("ratings");

    const review = new reviewDb({
      productId,
      name,
      userEmail,
      reviewId,
      rating,
      comment,
      profilePic,
      images: imageUrls,
      userId,
    });

    // Only include dynamicRatings if it exists and has length > 0
    if (dynamicRatings && dynamicRatings.length > 0) {
      review.dynamicRatings = dynamicRatings;
    }

    const product = await productsDB.findOneAndUpdate(
      {
        _id: productId,
      },
      {
        $push: { ratings: review },
      },
    );

    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    await review.save();

    res.status(201).send({ message: "Review Created", review: review });
  } catch (error) {
    // console.log(error);
    res.status(500).send({ message: "Error in creating review" });
  }
};

exports.createSpecialReview = async (req, res) => {
  try {
    const imageUrls = req.files
      .filter((file) => file.fieldname === "image")
      .map((file) => file.location);
    const reviewId = uuidv4();
    const { name, instagramUrl, comment } = req.body;
    const specialReview = new SpecialReview({
      name,
      instagramUrl,
      reviewId,
      comment,
      image: imageUrls[0],
    });

    const createdReview = await specialReview.save();
    res.status(201).send({ message: "Review Created", review: createdReview });
  } catch (error) {
    // console.log(error);
    res.status(500).send({ message: "Error in creating review" });
  }
};

exports.getSpecialReview = async (req, res) => {
  try {
    const reviews = await SpecialReview.find().sort({ createdAt: -1 }).limit(1);
    res.status(201).send(reviews[0]);
  } catch (error) {
    res.status(500).send({ message: "Error in getting reviews" });
  }
};

exports.getReview = async (req, res) => {
  try {
    const { productId } = req.query;
    const reviews = await reviewDb
      .find({ productId: productId })
      .sort({ createdAt: -1 });
    res.status(201).send(reviews);
  } catch (error) {
    res.status(500).send({ message: "Error in getting reviews" });
  }
};

exports.fetchAllReviewByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await reviewDb
      .find({ userId: userId })
      .sort({ createdAt: -1 });
    res.status(201).send(reviews);
  } catch (error) {
    res.status(500).send({ message: "Error in getting reviews" });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const review = await reviewDb.findOneAndDelete({ _id: reviewId });
    if (review) {
      res.send({ message: "Review Deleted" });
    } else {
      res.send("Error in Deletion.");
    }
  } catch (error) {
    res.status(500).send({ message: "Error in getting reviews" });
  }
};

exports.fetchProductsByCategory = async (req, res) => {
  const { category } = req.params;
  const { page, itemsPerPage } = req.query;

  if (!category) {
    return res.status(400).json({ error: "Category is missing." });
  }

  const categoryData = await categoriesDB.findOne({ name: category });
  let skipItems = 0;
  if (
    categoryData?.firstGrid?.description ||
    categoryData?.firstGrid?.image ||
    categoryData?.firstGrid?.title ||
    categoryData?.firstGrid?.link
  ) {
    skipItems++;
  }
  if (
    categoryData?.secondGrid?.description ||
    categoryData?.secondGrid?.image ||
    categoryData?.secondGrid?.title ||
    categoryData?.secondGrid?.link
  ) {
    skipItems++;
  }
  const updatedItemsPerPage = itemsPerPage - skipItems;
  if (page && updatedItemsPerPage) {
    const skip = (page - 1) * updatedItemsPerPage;
    const query = {
      category,
      isAccessories: false,
    };
    try {
      const products = await productsDB
        .find(query)
        .populate("author")
        .skip(skip)
        .limit(updatedItemsPerPage)
        .populate("ratings");

      // console.log(products.length);
      const totalproducts = await productsDB.find(query);

      // console.log(totalproducts.length);

      return res
        .status(200)
        .json({ products: products, totalproducts: totalproducts.length });
    } catch (error) {
      console.error("Error while fetching products by category:", error);
      return res.status(500).json({
        error: "An error occurred while fetching products by category.",
      });
    }
  } else {
    try {
      const products = await productsDB
        .find({
          category: category,
          isAccessories: false,
        })
        .populate("author")
        .sort({ popularity: -1 })
        .populate("ratings");
      res.status(200).json(products);
    } catch (error) {
      console.error("Error while fetching products by category:", error);
      res.status(500).json({
        error: "An error occurred while fetching products by category.",
      });
    }
  }
};

// PATCH: '/api/updateDemandType'
exports.updateDemandType = async (req, res) => {
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
      { new: true },
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
// PATCH: '/api/updateOffer'

// PATCH: '/api/updateSpecialPrice'
exports.updateSpecialPrice = async (req, res) => {
  try {
    const { productId, specialprice } = req.body;
    // console.log(req.body);

    if (!productId || !specialprice) {
      return res
        .status(400)
        .json({ error: "Product ID or special price is missing." });
    }
    const updatedProduct = await productsDB.findOneAndUpdate(
      { _id: productId },
      { specialprice },
      { new: true },
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }

    res
      .status(200)
      .json({ message: "Special Price created successfully", updatedProduct });
  } catch (error) {
    console.error("Error while updating special price:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating special price." });
  }
};

exports.removeSpecialPrice = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ error: "Product ID  is missing." });
    }
    const updatedProduct = await productsDB.findOneAndUpdate(
      { _id: productId },
      { specialprice: null },
      { new: true },
    );
    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.status(200).json({ message: "Special price removed", updatedProduct });
  } catch (error) {
    console.error("Error while removing special price:", error);
    res
      .status(500)
      .json({ error: "An error occurred while removing special price." });
  }
};

exports.getAllProductsByOffer = async (req, res) => {
  try {
    const { type } = req.params;
    const { itemsPerPage, page } = req.query;

    // console.log(itemsPerPage, page);

    // if (type === "all") {
    //   const products = await productsDB.find();
    //   return res.status(200).json(products);
    // }

    if (page && itemsPerPage) {
      const skip = (page - 1) * itemsPerPage;
      const products = await productsDB
        .find({
          offer: { $regex: new RegExp(type, "i") },
          isAccessories: false,
        })
        .populate("author")
        .skip(skip)
        .limit(itemsPerPage);

      // console.log("Offer", products.length);

      const Totalproducts = await productsDB.find({
        offer: { $regex: new RegExp(type, "i") },
      });
      return res
        .status(200)
        .json({ products: products, totalproducts: Totalproducts.length });
    }
    const products = await productsDB
      .find({
        offer: { $regex: new RegExp(type, "i") },
        isAccessories: false,
      })
      .populate("author")
      .sort({ popularity: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error while fetching products by offer:", error);
    res.status(500).json({
      error: "An error occurred while fetching products by offer.",
    });
  }
};

exports.getAllProductsByDemandType = async (req, res) => {
  try {
    const { type } = req.params;
    const products = await productsDB
      .find({
        demandtype: { $regex: new RegExp(type, "i") },
      })
      .populate("author")
      .sort({ popularity: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error while fetching products by demand type:", error);
    res.status(500).json({
      error: "An error occurred while fetching products by demand type.",
    });
  }
};

exports.requestForProduct = async (req, res) => {
  try {
    const { id, name, email } = req.body;
    const product = await productsDB.findById(id);
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }
    const requestedProduct = new RequestedProduct({
      productObjectId: id,
      requestedBy: name,
      requestedByEmail: email,
    });
    await requestedProduct.save();
    await sendEmailForProductRequest(email, product.productTitle);
    res.status(201).send({ message: "Request created successfully" });
  } catch (error) {
    // console.log(error);
    res.status(500).send({ message: "Error in creating request" });
  }
};

exports.getAllProductByAuthorID = async (req, res) => {
  try {
    const author = await UserDB.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }
    const products = await productsDB.find({ author: author._id });
    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.likeProduct = async (req, res) => {
  try {
    // console.log("check");
    const { productId, userId } = req.body;
    const product = await productsDB.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const user = await UserDB.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.likedProducts.includes(productId)) {
      return res.status(400).json({ message: "Product already liked" });
    }
    user.likedProducts.push(productId);
    product.likes += 1;
    await product.save();
    await user.save();
    // console.log(product.likes);
    res
      .status(200)
      .json({ message: "Product liked successfully", likes: product.likes });
  } catch (error) {
    // console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.unlikeProduct = async (req, res) => {
  try {
    const { productId, userId } = req.body;
    const product = await productsDB.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const user = await UserDB.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.likedProducts.includes(productId)) {
      return res.status(400).json({ message: "Product not liked" });
    }
    user.likedProducts = user.likedProducts.filter(
      (id) => id.toString() !== productId,
    );
    product.likes -= 1;
    await product.save();
    await user.save();
    res
      .status(200)
      .json({ message: "Product unliked successfully", likes: product.likes });
  } catch (error) {
    // console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.rankedProductsFoEachCategory = async (req, res) => {
  try {
    const categories = await categoriesDB.find().sort({ popularity: -1 });
    const rankedProducts = [];
    for (let i = 0; i < categories.length; i++) {
      const products = await productsDB
        .find({ category: categories[i].name, isAccessories: false })
        .sort({ popularity: -1 })
        .limit(3);
      if (products.length > 0) {
        rankedProducts.push({ category: categories[i].name, products });
      }
    }
    res.status(200).json(rankedProducts);
  } catch (error) {
    // console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.generateMaintenancePdf = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productsDB.findById(productId).populate("author");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const category = await categoriesDB.findOne({
      name: product.category,
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    let maintenanceDetailsHtml = "";
    category.maintenanceDetails.forEach((point, index) => {
      maintenanceDetailsHtml += `<p style="font-size: 18px; margin: 10px 0;">${
        point.heading &&
        `<span style="font-weight: 600;">
          ${index + 1}. ${point.heading}: 
        </span>`
      } ${point.description}</p>`;
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance Details</title>
</head>

<body style="padding: 20px;">
    <div class="container" style="width: 100%;  margin: 0 auto;">
        <div class="logo" style="text-align: center;">
            <svg width="200" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 697.2 147.3"
                style="enable-background:new 0 0 697.2 147.3;" xml:space="preserve">
                <path d="M68.4,19h-2.3l-36.9,99.7h-14v3.8h36.7v-3.8H33.2l10.3-27.7h32.2l9.9,27.7H69.2v3.8h48.2v-3.8h-13.6L68.4,19z M45,87.2
	l14.8-40.5h0.3l14.3,40.5H45z" />
                <polygon points="167.6,73.6 199.3,25.2 212.4,25.2 212.4,21.4 176.5,21.4 176.5,25.2 194.9,25.2 165.7,69.9 136,25.2 152.7,25.2 
	152.7,21.4 102.1,21.4 102.1,25.2 115.6,25.2 149.6,76.3 149.6,118.8 132.4,118.8 132.4,122.6 184.4,122.6 184.4,118.8 167.6,118.8 
	" />
                <path d="M251,19h-2.3l-36.9,99.7h-14v3.8h36.7v-3.8h-18.7l10.3-27.7h32.2l9.9,27.7h-16.4v3.8H300v-3.8h-13.6L251,19z M227.5,87.2
	l14.8-40.5h0.3l14.3,40.5H227.5z" />
                <path d="M301,21.4l-2.6,34.4h3.8c2.4-11.5,5.5-19.5,9.4-23.9c3.9-4.4,9-6.6,15.4-6.6h8.2v93.5h-18.1v3.8h54.1v-3.8h-18.1V25.2h8.2
	c6.3,0,11.5,2.2,15.4,6.6c3.9,4.4,7,12.4,9.4,23.9h3.9l-2.6-34.4H301z" />
                <path d="M493.5,116.2c-1.5-1.8-2.3-6-2.3-12.6c0-11.4-2.7-19.5-8.1-24.3c-5.4-4.8-12.3-8-20.8-9.7v-0.4c11.8-2,20.1-5,25.1-9
	c4.9-4,7.4-9.2,7.4-15.6c0-5.1-1.7-9.7-5.1-13.6c-3.4-4-7.4-6.6-12-7.8c-4.7-1.3-10.6-1.9-17.9-1.9h-55.5v3.9h15.9v93.5h-15.9v3.8
	h49.8v-3.8h-15.9V70.7h9.4c10.1,0,16.5,2.2,19.4,6.5c2.8,4.4,4.3,8.8,4.3,13.2l-0.3,12.8c-0.1,4.4,1.6,9,5,13.6
	c3.4,4.6,9.3,6.9,17.6,6.9c4.1,0,8.3-0.8,12.7-2.3v-3.7c-2.5,0.7-4.6,1.1-6.3,1.1C497.1,118.9,495,118,493.5,116.2z M438.2,67.1
	V25.2h17.1c4.3,0,7.7,0.3,10.4,0.9c2.6,0.6,4.9,2.3,6.8,5c1.9,2.7,2.8,7,2.8,12.9c0,7.2-0.9,12.4-2.8,15.7c-1.8,3.3-4.3,5.3-7.4,6.1
	s-7.5,1.2-13.4,1.2H438.2z" />
                <polygon points="518.9,25.2 535.5,25.2 535.5,118.8 518.9,118.8 518.9,122.6 570.1,122.6 570.1,118.8 553.4,118.8 553.4,25.2 
	570.1,25.2 570.1,21.4 518.9,21.4 " />
                <path d="M665.1,35.2C655.6,24.4,644.9,19,633,19c-12.7,0-23.8,5.3-33.4,15.9c-9.6,10.6-14.4,23.4-14.4,38.4
	c0,12.5,4.6,24.2,13.7,35.2c9.1,11,20.2,16.5,33.3,16.5c12.4,0,23.3-5.3,32.8-16c9.5-10.6,14.2-23,14.2-37.1
	C679.3,58.2,674.5,46,665.1,35.2z M656,102.1c-1.5,7.5-4.7,12.6-9.5,15.1c-4.9,2.6-9.7,3.8-14.5,3.8c-7.9,0-13.7-2.1-17.4-6.3
	c-3.7-4.2-6-9.6-6.9-16c-0.9-6.4-1.4-15.1-1.4-25.9c0-15.7,0.8-26.6,2.4-32.9c1.6-6.3,4.6-10.7,9-13.2c4.4-2.5,9.4-3.8,14.9-3.8
	c5.3,0,10,1.2,14.1,3.6c4.1,2.4,7,6.3,8.8,11.7c1.8,5.4,2.8,15.1,2.8,29.3C658.2,83,657.5,94.6,656,102.1z" />
            </svg>
        </div>

        <div style="display: flex; gap: 50px; margin-top: 60px; align-items: center;">
            <div>
                <img src=${product.images[0]}
                    alt="Maintenance Image" style="width: 300px; height: 300px;">
            </div>
            <div>
                <h1>${product.productTitle}</h1>
                <p style="font-size: 18px; font-weight: 500;"> ${
                  product.shortDescription
                }</p>
                <p style="font-size: 18px; "><span style="font-weight: 700;">Style</span> : <span>${
                  product.subcategory
                }</span></p>
                <p style="font-size: 18px;"><span style="font-weight: 700;">Type</span> : <span>${
                  product.type
                }</span></p>
                <p style="font-size: 18px;"><span style="font-weight: 700;">Material</span> : <span>${
                  product.material
                }</span></p>


            </div>

        </div>

         <div>
            <p style="margin: 5px 0; font-size: 16px;"><span>Author</span> : <span>${
              product?.author?.displayName || "-"
            }</span></p>
            <p style="margin: 5px 0; font-size: 16px;"><span>Product code:</span> : <span>${
              product.patternNumber
            }</span></p>
        </div>

        <div style=" margin: 20px 0;">
            <h2 style=" margin: 5px 0;">Maintenance</h2>
            ${maintenanceDetailsHtml}
        </div>
    </div>


    <footer style="position: absolute; bottom: 10px; width: 100%; text-align: center;">
        <p style="font-size: 14px; margin: 5px 0;">INDIA - ayatrio.com </p>
        <p style="font-size: 14px;  margin: 5px 0;">Email:info@ayatrio.com, Ph:9836465083</p>
    </footer>

</body>

</html>`;

    const file = { content: htmlContent };
    const options = { format: "A4" };

    pdf
      .generatePdf(file, options)
      .then((pdfBuffer) => {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=product-details.pdf",
        );
        res.send(pdfBuffer);
      })
      .catch((error) => {
        console.error("Failed to generate PDF", error);
        res.status(500).json({ error: "Failed to generate PDF" });
      });
  } catch (error) {
    // console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.generateInstallationPdf = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productsDB.findById(productId).populate("author");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const category = await categoriesDB.findOne({
      name: product.category,
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    let installationDetailsHtml = "";
    category.installationDetails?.forEach((point, index) => {
      installationDetailsHtml += `<p style="font-size: 18px; margin: 10px 0;">${
        point.heading &&
        `<span style="font-weight: 600;">
          ${index + 1}. ${point.heading}: 
        </span>`
      } ${point.description}</p>`;
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance Details</title>
</head>

<body style="padding: 20px;">
    <div class="container" style="width: 100%;  margin: 0 auto;">
        <div class="logo" style="text-align: center;">
            <svg width="200" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 697.2 147.3"
                style="enable-background:new 0 0 697.2 147.3;" xml:space="preserve">
                <path d="M68.4,19h-2.3l-36.9,99.7h-14v3.8h36.7v-3.8H33.2l10.3-27.7h32.2l9.9,27.7H69.2v3.8h48.2v-3.8h-13.6L68.4,19z M45,87.2
	l14.8-40.5h0.3l14.3,40.5H45z" />
                <polygon points="167.6,73.6 199.3,25.2 212.4,25.2 212.4,21.4 176.5,21.4 176.5,25.2 194.9,25.2 165.7,69.9 136,25.2 152.7,25.2 
	152.7,21.4 102.1,21.4 102.1,25.2 115.6,25.2 149.6,76.3 149.6,118.8 132.4,118.8 132.4,122.6 184.4,122.6 184.4,118.8 167.6,118.8 
	" />
                <path d="M251,19h-2.3l-36.9,99.7h-14v3.8h36.7v-3.8h-18.7l10.3-27.7h32.2l9.9,27.7h-16.4v3.8H300v-3.8h-13.6L251,19z M227.5,87.2
	l14.8-40.5h0.3l14.3,40.5H227.5z" />
                <path d="M301,21.4l-2.6,34.4h3.8c2.4-11.5,5.5-19.5,9.4-23.9c3.9-4.4,9-6.6,15.4-6.6h8.2v93.5h-18.1v3.8h54.1v-3.8h-18.1V25.2h8.2
	c6.3,0,11.5,2.2,15.4,6.6c3.9,4.4,7,12.4,9.4,23.9h3.9l-2.6-34.4H301z" />
                <path d="M493.5,116.2c-1.5-1.8-2.3-6-2.3-12.6c0-11.4-2.7-19.5-8.1-24.3c-5.4-4.8-12.3-8-20.8-9.7v-0.4c11.8-2,20.1-5,25.1-9
	c4.9-4,7.4-9.2,7.4-15.6c0-5.1-1.7-9.7-5.1-13.6c-3.4-4-7.4-6.6-12-7.8c-4.7-1.3-10.6-1.9-17.9-1.9h-55.5v3.9h15.9v93.5h-15.9v3.8
	h49.8v-3.8h-15.9V70.7h9.4c10.1,0,16.5,2.2,19.4,6.5c2.8,4.4,4.3,8.8,4.3,13.2l-0.3,12.8c-0.1,4.4,1.6,9,5,13.6
	c3.4,4.6,9.3,6.9,17.6,6.9c4.1,0,8.3-0.8,12.7-2.3v-3.7c-2.5,0.7-4.6,1.1-6.3,1.1C497.1,118.9,495,118,493.5,116.2z M438.2,67.1
	V25.2h17.1c4.3,0,7.7,0.3,10.4,0.9c2.6,0.6,4.9,2.3,6.8,5c1.9,2.7,2.8,7,2.8,12.9c0,7.2-0.9,12.4-2.8,15.7c-1.8,3.3-4.3,5.3-7.4,6.1
	s-7.5,1.2-13.4,1.2H438.2z" />
                <polygon points="518.9,25.2 535.5,25.2 535.5,118.8 518.9,118.8 518.9,122.6 570.1,122.6 570.1,118.8 553.4,118.8 553.4,25.2 
	570.1,25.2 570.1,21.4 518.9,21.4 " />
                <path d="M665.1,35.2C655.6,24.4,644.9,19,633,19c-12.7,0-23.8,5.3-33.4,15.9c-9.6,10.6-14.4,23.4-14.4,38.4
	c0,12.5,4.6,24.2,13.7,35.2c9.1,11,20.2,16.5,33.3,16.5c12.4,0,23.3-5.3,32.8-16c9.5-10.6,14.2-23,14.2-37.1
	C679.3,58.2,674.5,46,665.1,35.2z M656,102.1c-1.5,7.5-4.7,12.6-9.5,15.1c-4.9,2.6-9.7,3.8-14.5,3.8c-7.9,0-13.7-2.1-17.4-6.3
	c-3.7-4.2-6-9.6-6.9-16c-0.9-6.4-1.4-15.1-1.4-25.9c0-15.7,0.8-26.6,2.4-32.9c1.6-6.3,4.6-10.7,9-13.2c4.4-2.5,9.4-3.8,14.9-3.8
	c5.3,0,10,1.2,14.1,3.6c4.1,2.4,7,6.3,8.8,11.7c1.8,5.4,2.8,15.1,2.8,29.3C658.2,83,657.5,94.6,656,102.1z" />
            </svg>
        </div>

        <div style="display: flex; gap: 50px; margin-top: 60px; align-items: center;">
            <div>
                <img src=${product.images[0]}
                    alt="Maintenance Image" style="width: 300px; height: 300px;">
            </div>
            <div>
                <h1>${product.productTitle}</h1>
                <p style="font-size: 18px; font-weight: 500;"> ${
                  product.shortDescription
                }</p>
                <p style="font-size: 18px; "><span style="font-weight: 700;">Style</span> : <span>${
                  product.subcategory
                }</span></p>
                <p style="font-size: 18px;"><span style="font-weight: 700;">Type</span> : <span>${
                  product.type
                }</span></p>
                <p style="font-size: 18px;"><span style="font-weight: 700;">Material</span> : <span>${
                  product.material
                }</span></p>


            </div>

        </div>

         <div>
            <p style="margin: 5px 0; font-size: 16px;"><span>Author</span> : <span>${
              product?.author?.displayName || "-"
            }</span></p>
            <p style="margin: 5px 0; font-size: 16px;"><span>Product code:</span> : <span>${
              product.patternNumber
            }</span></p>
        </div>

        <div style=" margin: 20px 0;">
            <h2 style=" margin: 5px 0;">Installation</h2>
            ${installationDetailsHtml}
        </div>
    </div>


    <footer style="position: absolute; bottom: 10px; width: 100%; text-align: center;">
        <p style="font-size: 14px; margin: 5px 0;">INDIA - ayatrio.com </p>
        <p style="font-size: 14px;  margin: 5px 0;">Email:info@ayatrio.com, Ph:9836465083</p>
    </footer>

</body>

</html>`;

    const file = { content: htmlContent };
    const options = { format: "A4" };

    pdf
      .generatePdf(file, options)
      .then((pdfBuffer) => {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=product-details.pdf",
        );
        res.send(pdfBuffer);
      })
      .catch((error) => {
        console.error("Failed to generate PDF", error);
        res.status(500).json({ error: "Failed to generate PDF" });
      });
  } catch (error) {
    // console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.fetchAccessoriesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const accessories = await productsDB.find({
      category: category,
      isAccessories: true,
    });
    res.status(200).json(accessories);
  } catch (error) {
    // console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};
