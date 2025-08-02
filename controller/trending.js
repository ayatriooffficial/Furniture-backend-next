const categoriesDB = require("../model/Category");
const productsDB = require("../model/Products");
const {
  incrementPopularityUtil,
  // incrementCategoryPopularityUtil,
  // incrementSubCategoryPopularityUtil,
} = require("../utils/incrementPopularity");
const mongoose = require("mongoose");

// POST 'api/increment-popularity/:id'
exports.incrementPopularity = async (req, res) => {
  const { title } = req.query;
  // //console.log("Incrementing popularity for product:", title);
  try {
    await incrementPopularityUtil(title);
    res.json({ message: "Product popularity incremented successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Test endpoint to increment popularity and return updated category
exports.testIncrementPopularity = async (req, res) => {
  const { title } = req.query;
  //console.log("Test incrementing popularity for product:", title);
  try {
    // First, get the product to verify it exists
    const product = await productsDB.findOne({ productTitle: title });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    //console.log("Found product:", product.productTitle);
    //console.log("Current popularity:", product.popularity);
    //console.log("Category:", product.category);

    // Increment popularity
    await incrementPopularityUtil(title);

    // Get the updated category
    const category = await categoriesDB.findOne({
      name: { $regex: new RegExp(product.category, "i") }
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    //console.log("Updated category popularity:", category.popularity);

    res.json({
      message: "Test successful",
      product: {
        title: product.productTitle,
        popularity: product.popularity,
        category: product.category
      },
      category: {
        name: category.name,
        popularity: category.popularity
      }
    });
  } catch (error) {
    console.error("Test error:", error);
    res.status(500).json({
      message: "Test failed",
      error: error.message
    });
  }
};

exports.trendingProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const lastIndex = page * limit;
  try {
    const trendingProducts = await productsDB
      .find({ popularity: { $gt: 2 }, isAccessories: false })
      .sort({ popularity: -1 })
      .limit(5);
    let result = trendingProducts.slice(skip, lastIndex);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// exports.incrementCategoryPopularity = async (req, res) => {
//   const { category } = req.query;
//   try {
//     await incrementCategoryPopularityUtil(category);
//     res.json({ message: "Category popularity incremented successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.incrementSubCategoryPopularity = async (req, res) => {
//   const { category, subCategory } = req.query;
//   //console.log(req.query);
//   try {
//     await incrementSubCategoryPopularityUtil(category, subCategory);
//     res.json({ message: "subCategory popularity incremented successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.trendingSubCategories = async (req, res) => {
//   const { category } = req.query;
//   try {
//     const trendingSubCategories = await categoriesDB
//       .findOne({ name: category })
//       .select("subcategories")
//       // .sort({ popularity: 1 });
//     res.json(trendingSubCategories);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


exports.homeTrendingCategoriesImgAndType = async (req, res) => {
  try {
    const categories = await categoriesDB.find({}, { image: 1, type: 1, name: 1, _id: 0 });
    res.json(categories);
  } catch (error) {
    console.error("Error in homeTrendingCategoriesImgAndType:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.trendingCategories = async (req, res) => {
  try {
    // //console.log("Fetching trending categories from database:", mongoose.connection.db.databaseName);

    // First, let's check if we have any categories at all
    const allCategories = await categoriesDB.find();
    //console.log("Total categories in database:", allCategories.length);

    if (allCategories.length === 0) {
      return res.status(404).json({
        message: "No categories found in database",
        details: "The categories collection is empty"
      });
    }

    // Log the first category to see its structure
    //console.log("Sample category:", JSON.stringify(allCategories[0], null, 2));

    // Check if any categories have popularity > 0
    const categoriesWithPopularity = allCategories.filter(cat => cat.popularity > 0);
    //console.log("Categories with popularity > 0:", categoriesWithPopularity.length);

    // Get trending categories with detailed logging
    const trendingCategories = await categoriesDB
      .find()
      .sort({ popularity: -1 });

    //console.log("Found trending categories:", trendingCategories.length);

    if (trendingCategories.length === 0) {
      // If we have categories but none are trending, let's return all categories
      //console.log("No trending categories found, returning all categories");
      return res.json(allCategories);
    }

    res.json(trendingCategories);
  } catch (error) {
    console.error("Error in trendingCategories:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.trendingCategoriesNames = async (req, res) => {
  try {
    const categories = await categoriesDB
      .find()
      .select('_id name') // include both _id and name fields
      .sort({ popularity: -1 }); // optional: sort by popularity

    if (categories.length === 0) {
      return res.status(404).json({
        message: "No categories found in database",
        details: "The categories collection is empty"
      });
    }

    res.json(categories); // each object has _id and name only

  } catch (error) {
    console.error("Error in trendingCategories:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};




exports.popularSearchProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const lastIndex = page * limit;
  try {
    const popularSearchProducts = await productsDB
      .find({ popularity: { $gt: 2 } })
      .sort({ popularity: -1 })
      .limit(5)
      .select("productTitle category subcategory");
    let result = popularSearchProducts.slice(skip, lastIndex);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
