const categoriesDB = require("../model/Category");
const productsDB = require("../model/Products");

// Increment the popularity of a product by one
const incrementPopularityUtil = async (productTitle) => {
  try {
    const product = await productsDB.findOne({ productTitle: productTitle });
    if (!product) {
      return;
    }

    product.popularity += 1;
    await product.save();

    // const category = await categoriesDB.findOne({ name: product.category });
    const category = await categoriesDB.findOne({
      name: { $regex: new RegExp(product.category, "i") },
    });
    if (category) {
      const productsByCategory = await productsDB.find({
        category: product.category,
      });

      let totalCategoryPopularity = 0;
      let totalSubCategoryPopularity = 0;
      let totalSubCategoryProducts = 0;

      productsByCategory.forEach((categoryProduct) => {
        if (product.subcategory === categoryProduct.subcategory) {
          totalSubCategoryProducts += 1;
          totalSubCategoryPopularity += categoryProduct.popularity;
        }
        totalCategoryPopularity += categoryProduct.popularity;
      });

      category.popularity = totalCategoryPopularity / productsByCategory.length;

      category.subcategories.forEach((subCategory) => {
        if (subCategory.name === product.subcategory) {
          subCategory.popularity =
            totalSubCategoryPopularity / totalSubCategoryProducts;
        }
      });

      await category.save();
    } else {
    }
  } catch (error) {
    console.error("Error updating product popularity:", error);
    throw error;
  }
};

// const incrementCategoryPopularityUtil = async (categoryName) => {
//   try {
//     const category = await categoriesDB.findOne({
//       name: new RegExp(categoryName, "i"),
//     });
//     if (category) {
//       category.popularity += 1;
//       await category.save();
//     }
//   } catch (error) {
//     console.error("Error updating category popularity:", error);
//     throw error;
//   }
// };

// const incrementSubCategoryPopularityUtil = async (
//   categoryName,
//   subCategoryName
// ) => {
//   try {
//     const category = await categoriesDB.findOne({ name: categoryName });
//     console.log(category);
//     if (category) {
//       const subCategory = category.subcategories.find(
//         (sub) => sub.name === subCategoryName
//       );
//       if (subCategory) {
//         subCategory.popularity += 1;
//         await category.save();
//       }
//     }
//   } catch (error) {
//     console.error("Error updating subcategory popularity:", error);
//     throw error;
//   }
// };

// exports.incrementSubCategoryPopularityUtil = incrementSubCategoryPopularityUtil;
// exports.incrementCategoryPopularityUtil = incrementCategoryPopularityUtil;
exports.incrementPopularityUtil = incrementPopularityUtil;
