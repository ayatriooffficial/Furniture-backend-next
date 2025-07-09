const categoriesDB = require("../model/Category");
const productsDB = require("../model/Products");

// Increment the popularity of a product by one
const incrementPopularityUtil = async (productTitle) => {
  try {
    console.log("Incrementing popularity for product:", productTitle);
    
    const product = await productsDB.findOne({ productTitle: productTitle });
    if (!product) {
      console.log("Product not found:", productTitle);
      return;
    }
    
    console.log("Current product popularity:", product.popularity);
    product.popularity += 1;
    await product.save();
    console.log("Updated product popularity:", product.popularity);
    
    // const category = await categoriesDB.findOne({ name: product.category });
    const category = await categoriesDB.findOne({ name : { $regex: new RegExp(product.category, "i") } });
    if (category) {
      console.log("Found category:", category.name);
      
      const productsByCategory = await productsDB.find({
        category: product.category,
      });
      console.log("Total products in category:", productsByCategory.length);
      
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
      
      console.log("Total category popularity:", totalCategoryPopularity);
      console.log("Average category popularity:", totalCategoryPopularity / productsByCategory.length);
      
      category.popularity = totalCategoryPopularity / productsByCategory.length;
      console.log("Updated category popularity:", category.popularity);
      
      category.subcategories.forEach((subCategory) => {
        if (subCategory.name === product.subcategory) {
          subCategory.popularity =
            totalSubCategoryPopularity / totalSubCategoryProducts;
          console.log("Updated subcategory popularity:", subCategory.name, subCategory.popularity);
        }
      });
      
      await category.save();
      console.log("Category saved successfully");
    } else {
      console.log("Category not found for product:", product.category);
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
