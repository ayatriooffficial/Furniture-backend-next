const preferencesDB = require("../model/Preferences");
const productsDB = require("../model/Products");

exports.preferences = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Please provide category data" });
    }

    const { deviceId, userPreferredCategories } = req.body;

    if (!deviceId || !userPreferredCategories) {
      return res.status(400).json({ error: "Fill in all the required fields" });
    }

    const subcategoriesArray = combineSubcategories(userPreferredCategories);

    const existingPreference = await preferencesDB.findOne({ deviceId });

    if (existingPreference) {
      const recommendedProducts = await productsDB.find({
        subcategory: {
          $in: subcategoriesArray.map((sub) => new RegExp(sub, "i")),
        },
      });

      const uniqueNewRecommendations = recommendedProducts.map((product) =>
        product._id.toString()
      );

      existingPreference.recommendedProducts =
        existingPreference.recommendedProducts.filter(
          (productId) =>
            !uniqueNewRecommendations.includes(productId.toString())
        );

      if (recommendedProducts.length > 0) {
        existingPreference.recommendedProducts = [
          ...uniqueNewRecommendations,
          ...existingPreference.recommendedProducts.map((id) => id.toString()),
        ];
      }

      await existingPreference.save();

      return res
        .status(200)
        .json({ message: "Preferences updated successfully..!" });
    } else {
      const newPreference = new preferencesDB({
        deviceId,
        recommendedProducts: [],
      });

      // Send recommendations
      const recommendedProducts = await productsDB.find({
        subcategory: {
          $in: subcategoriesArray.map((sub) => new RegExp(sub, "i")),
        },
      });

      // Filter only product Id to store in DB
      newPreference.recommendedProducts = recommendedProducts.map(
        (product) => product._id
      );

      // Save new preferences in DB
      await newPreference.save();

      return res
        .status(201)
        .json({ message: "Preferences stored successfully..!" });
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error while saving user preferences",
      details: error.message,
    });
  }
};

// ---------------------------------

function combineSubcategories(categories) {
  let combinedSubcategories = [];

  categories.forEach((category) => {
    if (category.subcategories && Array.isArray(category.subcategories)) {
      combinedSubcategories = combinedSubcategories.concat(
        category.subcategories
      );
    }
  });

  return combinedSubcategories;
}

// GET: api/getRecommendation
exports.getRecommendation = async (req, res) => {
  try {
    const deviceId = req.query.deviceId;

    let recommendations = await preferencesDB
      .findOne({ deviceId }, { recommendedProducts: 1 })
      .populate({
        path: "recommendedProducts",
        select: "",
      })
      .exec();

    const allProducts = await productsDB
      .find({ popularity: { $gt: 2 } })
      .sort({ popularity: -1 });

    if (recommendations && recommendations.recommendedProducts.length > 0) {
      const recommendedProducts = recommendations.recommendedProducts.map(
        (product) => product.id
      );

      const filteredAllProducts = allProducts.filter((product) => {
        return !recommendedProducts.includes(product.id);
      });

      const mergedProducts = [
        ...recommendations.recommendedProducts,
        ...filteredAllProducts,
      ];

      const sortedProducts = mergedProducts.sort(
        (a, b) => b.popularity - a.popularity
      );

      return res.json({
        recommendations: { recommendedProducts: sortedProducts },
      });
    }

    return res.json({ recommendations: { recommendedProducts: allProducts } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// exports.getRecommendationCategoryWise = async (req, res) => {
//   try {
//     console.log("Fetching recommendations...");
//     const { deviceId } = req.query;
//     const categoryLimit = parseInt(req.query.categoryLimit) || 1;
//     const productLimit = parseInt(req.query.productLimit) || 3;
//     const categorySkip = parseInt(req.query.categorySkip) || 0;

//     // Fetch recommendations from user preferences
//     let recommendations = await preferencesDB
//       .findOne({ deviceId }, { recommendedProducts: 1 })
//       .populate({
//         path: "recommendedProducts",
//         select: "",
//       })
//       .exec();

//     // Fetch popular products with filtering to exclude recommended ones
//     let recommendedProductIds = recommendations
//       ? recommendations.recommendedProducts.map((product) => product.id)
//       : [];

//     const allProducts = await productsDB
//       .find({ popularity: { $gt: 2 }, id: { $nin: recommendedProductIds } })
//       .sort({ popularity: -1 });

//     let mergedProducts = [];
//     if (recommendations && recommendations.recommendedProducts.length > 0) {
//       mergedProducts = [...recommendations.recommendedProducts, ...allProducts];
//     } else {
//       mergedProducts = allProducts;
//     }

//     // Categorize products
//     const categorizedProducts = {};
//     mergedProducts.forEach((product) => {
//       if (!categorizedProducts[product.category]) {
//         categorizedProducts[product.category] = [];
//       }
//       categorizedProducts[product.category].push(product);
//     });

//     // console.log("categorizedProducts", categorizedProducts);

//     // Apply category and product limits
//     const limitedCategories = Object.keys(categorizedProducts)
//       .slice(categorySkip, categorySkip + categoryLimit)
//       .reduce((acc, category) => {
//         acc[category] = categorizedProducts[category].slice(0, productLimit);
//         return acc;
//       }, {});

//     console.log("limitedCategories", limitedCategories);

//     console.log("Bhej diya")

//     return res.json({
//       recommendations: {
//         recommendedProducts: limitedCategories,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

exports.getRecommendationCategoryWise = async (req, res) => {
  try {
    const { deviceId } = req.query;

    const categoryLimit = parseInt(req.query.categoryLimit) || 4;
    const categorySkip = parseInt(req.query.categorySkip) || 0;
    const productLimit = parseInt(req.query.productLimit) || 3;
    const productSkip = parseInt(req.query.productSkip) || 0;

    // Fetch recommendations from user preferences
    let recommendations = await preferencesDB
      .findOne({ deviceId }, { recommendedProducts: 1 })
      .populate({
        path: "recommendedProducts",
        select: "",
      })
      .exec();

    // Fetch popular products, excluding already recommended ones
    const recommendedProductIds = recommendations
      ? recommendations.recommendedProducts.map((product) => product.id)
      : [];

    const allProducts = await productsDB
      .find({ popularity: { $gt: 2 }, id: { $nin: recommendedProductIds } })
      .sort({ popularity: -1 });

    let mergedProducts = [];
    if (recommendations && recommendations.recommendedProducts.length > 0) {
      mergedProducts = [...recommendations.recommendedProducts, ...allProducts];
    } else {
      mergedProducts = allProducts;
    }

    // Categorize products
    const categorizedProducts = {};
    mergedProducts.forEach((product) => {
      if (!categorizedProducts[product.category]) {
        categorizedProducts[product.category] = [];
      }
      categorizedProducts[product.category].push(product);
    });

    // Apply category skip and limit
    const categories = Object.keys(categorizedProducts);
    const selectedCategories = categories.slice(
      categorySkip,
      categorySkip + categoryLimit
    );

    // Prepare response with product skip and limit for each category
    const limitedCategories = selectedCategories.reduce((acc, category) => {
      const products = categorizedProducts[category] || [];
      acc[category] = {
        products: products.slice(productSkip, productSkip + productLimit),
        hasMoreProducts: productSkip + productLimit < products.length, // Flag for more products
      };
      return acc;
    }, {});

    // Check if more categories are available
    const hasMoreCategories = categorySkip + categoryLimit < categories.length;

    return res.json({
      recommendations: {
        categories: limitedCategories,
        hasMoreCategories, // Flag for more categories
      },
    });
  } catch (error) {
    console.error("Error in fetching recommendations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
