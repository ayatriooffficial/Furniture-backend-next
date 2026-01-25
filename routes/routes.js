const router = require("express").Router();
const mongoose = require("mongoose");

const modelsToLoad = [
  "admin",
  "Author",
  "bannerSection",
  "Cart",
  "Category",
  "CategoryDescription",
  "CityHobbie",
  "DemandType",
  "ExternalOffer",
  "FreeSampleCart",
  "HashtagPost",
  "Header",
  "imgchanger",
  "ImgGrid",
  "ImgSection",
  "LiveRoomAdmin",
  "mapmodel",
  "MidSection",
  "ModelCategory",
  "newProductSection",
  "Offers",
  "Order",
  "poster",
  "Preferences",
  "ProfileContent",
  "Products",
  "Purchase",
  "RequestedProduct",
  "review",
  "room",
  "RoomMain",
  "roomType",
  "ShippingRate",
  "Slider",
  "SpecialReview",
  "staticSection",
  "Store",
  "Suggestions",
  "Urgency",
  "User",
  "UserLocation",
  "VEModel",
];

modelsToLoad.forEach((modelName) => {
  try {
    require(`../model/${modelName}`);
    console.log(`✅ Loaded model: ${modelName}`);
  } catch (err) {
    console.error(` FAILED to load model ${modelName}:`, err.message);
  }
});

// Log all registered models
const registered = mongoose.modelNames();
console.log("\n ALL REGISTERED MODELS IN MONGOOSE:");
console.log(registered);
console.log(
  ` Total models registered: ${registered.length} / ${modelsToLoad.length}`,
);

// Identify missing models
const missing = modelsToLoad.filter((m) => !registered.includes(m));
if (missing.length > 0) {
  console.warn(" Missing models that failed to register:", missing);
} else {
  console.log("ALL MODELS SUCCESSFULLY REGISTERED!");
}

// Map mongoose model names to expected names
const expectedModels = [
  "users",
  "admin",
  "authors",
  "bannerSectionImg",
  "Cart",
  "ProductCategories",
  "CategoryDescription",
  "DemandType",
  "ExternalOffer",
  "FreeSampleCart",
  "HashtagPost",
  "Header",
  "ImgGrid",
  "MidImages",
  "LiveRoomAdmin",
  "Map",
  "Imagechanger",
  "CategoryForModel",
  "newProductSectionImg",
  "Offers",
  "order",
  "posters",
  "preferences",
  "products",
  "Purchase",
  "RequestedProduct",
  "Review",
  "rooms",
  "roomMain",
  "roomType",
  "Slider",
  "Specialreview",
  "StaticSection",
  "Store",
  "Suggestions",
  "urgency",
  "UserLocation",
  "VirtualExperience",
];

const modelDiscrepancies = expectedModels.filter(
  (m) => !registered.includes(m),
);
if (modelDiscrepancies.length > 0) {
  console.warn(
    `⚠️  Models in collection that weren't imported: ${modelDiscrepancies}`,
  );
}

// import middleware
const { uploadImage } = require("../middleware/uploadImage");
const verifyAdminToken = require("../middleware/verifyAdminToken");
const productAssetController = require("../controller/productAssetController");
const cleanupController = require("../controller/cleanupController");
// import controllers
const controller = require("../controller/bin/controller");
const cartController = require("../controller/cart");
const productController = require("../controller/products");
const suggestionController = require("../controller/suggestion");
const roomController = require("../controller/room");
const recommendationController = require("../controller/recommendation");
const trendingController = require("../controller/trending");
const orderController = require("../controller/order");
const mapController = require("../controller/mapcontroller");
const VirtualExperience = require("../controller/VIrtualExperiance");
const productmail = require("../controller/productmail");
const RoomMain = require("../controller/RoomMain");
const DemandType = require("../controller/demandType");
const Offers = require("../controller/offers");
const hashtagPostController = require("../controller/home/hashtagPost");
const paymentController = require("../controller/payment");
const storeController = require("../controller/store");
const userLocationController = require("../controller/userLocation");
const liveRoomAdminController = require("../controller/liveRoomAdmin");
const authorController = require("../controller/author");
const shippingRateController = require("../controller/shippingRate");
const FreeSampleCart = require("../model/FreeSampleCart");
const urgencyController = require("../controller/urgency");
const categoryController = require("../controller/modelCategory");
const purchaseController = require("../controller/purchase");
const roomTypeController = require("../controller/roomType");
// 🎇🎇 ---------------------------------------------------------------------------------

// add modelproductcategory
router.post("/aimodelcategories", categoryController.createModelCategory);

// Route to get images for a specific category and room
router.get(
  "/aimodelcategories/:categoryname/:roomName",
  categoryController.getCategoryImages,
);

// Temporary upload endpoint: upload a single file to Cloudinary and return URL
router.post(
  "/upload",
  /* verifyAdminToken, */
  // accept multiple files under field name 'file' (up to 20)
  uploadImage.array("file", 20),
  (req, res) => {
    try {
      const files = req.files || (req.file ? [req.file] : []);
      if (!files || files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });

      // Map each multer file to a canonical URL
      const urls = files
        .map(
          (file) =>
            file.path || file.secure_url || file.location || file.url || null,
        )
        .filter(Boolean);

      console.log(`[upload] uploaded ${urls.length} file(s)`);
      return res.json({ ok: true, urls, files });
    } catch (err) {
      console.error("/upload error", err);
      return res.status(500).json({ error: err.message });
    }
  },
);

//product confirmation email
router.post("/send-email", productmail.sendPurchaseConfirmation);

// popup 🎈
router.get("/categories", controller.getCategories);
router.post(
  "/createCategory",
  uploadImage.fields([
    { name: "image", maxCount: 1 },
    { name: "subCategoriesImage", maxCount: 12 },
    { name: "maintenanceDetails", maxCount: 1 },
    { name: "certification", maxCount: 1 },
    { name: "firstImage", maxCount: 1 },
    { name: "secondImage", maxCount: 1 },
  ]),
  controller.createCategory,
);

//features for category and subcategory
// router.post("/addCard/:categoryId", controller.addCardInCategory);
// router.delete(
//   "/deleteCard/:categoryId/:cardId",
//   controller.deleteCardInCategory
// );

// router.post("/addTip/:categoryId", controller.addTipsInCategory);
// router.delete("/deleteTip/:categoryId/:tipId", controller.deleteTipsInCategory);

// sub catagory

// router.post("/addSubCard/:categoryId", controller.addCardInSubCategory);
// router.delete(
//   "/deleteCard/:categoryId/:subCategoryId/:cardId",
//   controller.deleteCardInSubCategory
// );

// router.post("/addSubTip/:categoryId", controller.addTipsInSubCategory);
// router.delete(
//   "/deleteSubTip/:categoryId/:subCategoryId/:tipId",
//   controller.deleteTipsInSubCategory
// );
//oof

router.post("/addCategoryFeatures/:categoryId", controller.addCategoryFeatures);

router.delete(
  "/deleteCategoryFeatures/:categoryId/:featureId",
  controller.deleteCategoryFeatures,
);
router.delete(
  "/deletesubCategoryFeatures/:categoryId/subCategory/:subCategoryId/:featureId",
  controller.deletesubCategoryFeatures,
);

router.put(
  "/categories/:categoryId/subCategory/:subCategoryId",
  controller.updateSubCategoryField,
);

//features end
router.get(
  "/getallProductsBySubCategory",
  controller.getallProductsBySubCategory,
);

router.get(
  "/getCategoryByTypeModified/:type",
  controller.getCategoriesByTypeModified,
);
router.get(
  "/getCategoriesByTypeOnlyNames/:type",
  controller.getCategoriesByTypeOnlyNames,
);
router.get("/getCategoryByName/:categoryName", controller.getCategoryByName);
router.get("/getCategoriesByType/:type", controller.getCategoriesByType);
router.get(
  "/getCategoriesByTypeLimtedData/:type",
  controller.getCategoriesByTypeWithLimitedData,
);
router.get("/getSubCategories/:categoryName", controller.getSubCategories);
router.get(
  "/getCategoryWithSubCategoryByName/:categoryName",
  controller.getCategoryWithSubCategoryByName,
);
router.get(
  "/getSubCategoryDetailByCategoryAndSubCategoryName",
  controller.getSubCategoryDetailByCategoryAndSubCategoryName,
);
router.delete("/deleteCategory/:categoryName", controller.deleteCategory);
router.delete(
  "/deleteSubCategory/:categoryId/subCategory/:subcategoryId",
  controller.DeleteSubCategory,
);
router.post(
  "/createSubCategory/:categoryId",
  uploadImage.fields([{ name: "image", maxCount: 1 }]),
  controller.CreateSubCategory,
);
//get faqs of a category
router.get("/getCategoryFaq/:categoryId", controller.getCategoryFaq);
router.delete("/categories/:categoryId/faq/:faqId", controller.deleteFaq);
router.delete(
  "/categories/:categoryId/subCategory/:subCategoryId/faq/:faqId",
  controller.deleteSubCategoryFaq,
);
router.delete(
  "/categories/:categoryId/subCategory/:subCategoryId/feature/:featureId",
  controller.deleteSubCategoryFeature,
);
router.delete(
  "/categories/:categoryId/subCategory/:subCategoryId/product/:productId",
  controller.deleteSubCategoryProduct,
);
router.post("/categories/:categoryId/faq", controller.addFaqToCategory);

router.get("/checkKeyword", controller.checkKeyword);

router.post(
  "/updateCategoryFirstGrid/:categoryId",
  uploadImage.fields([{ name: "firstImage", maxCount: 1 }]),
  controller.updateCategoryFirstGrid,
);
router.post(
  "/updateCategorySecondGrid/:categoryId",
  uploadImage.fields([{ name: "secondImage", maxCount: 1 }]),
  controller.updateCategorySecondGrid,
);

router.patch(
  "/deleteCategoryFirstGrid/:categoryId",
  controller.deleteCategoryFirstGrid,
);
router.patch(
  "/deleteCategorySecondGrid/:categoryId",
  controller.deleteCategorySecondGrid,
);
router.patch(
  "/updatecategorymetadata/:categoryName",
  controller.updateCategoryMetadata,
);

router.patch(
  "/updatecategoryh1title/:categoryName",
  controller.updateCategoryh1title,
);
router.patch(
  "/updatePdescCategory/:categoryName",
  controller.updatePdescCategoryByName,
);
// router.put("/EditSubCategory/:categoryId/subcategory/:subcategoryId", controller.EditSubCategory)
router.get("/citiesAndHobbies", controller.getCitiesAndHobbies);

router.get("/trendingCategories", trendingController.trendingCategories);
router.get(
  "/trendingCategoriesNames",
  trendingController.trendingCategoriesNames,
);
router.get(
  "/homeTrendingCategoriesImgAndType",
  trendingController.homeTrendingCategoriesImgAndType,
);
router.get("/popularSearchProducts", trendingController.popularSearchProducts);

// // recommendation engine 🎨
router
  .post("/preferences", recommendationController.preferences)
  .get("/getRecommendation", recommendationController.getRecommendation);

// recomendation engine with limit
router
  // .post("/preferences", recommendationController.preferences)
  .get(
    "/getRecommendationCategoryWise",
    recommendationController.getRecommendationCategoryWise,
  );

// cart 🛒

// Route to increase service quantity
router.post("/cart/service/quantity", cartController.increaseServiceQuantity);
router.post(
  "/cart/service/addServicesToProduct",
  cartController.addServicesToProduct,
);
router.post(
  "/cart/service/deleteServiceFromProduct",
  cartController.deleteServiceFromProduct,
);
router.post(
  "/cart/accessory/quantity",
  cartController.increaseAccessoriesQuantity,
);

//Add free sanple in cart

router.get("/cart/freesampling", cartController.getFreeSamples);
router.post("/cart/freeSampling", cartController.addFreeSample);
router.delete("/cart/freeSampling", cartController.deleteFreeSample);

router
  .post("/cart", cartController.createCart)
  .put("/cart", cartController.updateCartItemQuantity)
  .get("/cart", cartController.getCart)
  .delete("/cart", cartController.deleteCartItem);

// payment 💲
router
  .post("/checkout", orderController.checkout)
  .post("/order", orderController.order)
  .get("/order/:orderId", orderController.getOrder)
  .put("/order", orderController.updateOrder); // payment - true

// Room 🏡
router
  .post("/createRoom", uploadImage.array("image", 1), roomController.createRoom)
  .delete("/deleteroom/:roomId", roomController.deleteRoomById)
  .get("/rooms/:roomType", roomController.getRooms)
  .get("/getAllRooms", roomController.getAllRooms)
  .get("/getTabsRoom", roomController.getTabsRoom)
  .get("/getAllDifferentRoomTypes", roomController.getAllDifferentRoomTypes)
  .get(
    "/getAllCategoriesByRoomType/:roomType",
    roomController.getAllCategoriesByRoomType,
  )
  .get("/getRoomByQuery", roomController.getRoomByQuery)
  .get(
    "/getAllRoomsByCategory/:productCategory",
    roomController.getAllRoomsByCategory,
  )
  .post("/addSpecialRoomInCategory", roomController.addSpecialRoomInCategory)
  .get(
    "/getCategorySpecialRoom/:categoryName",
    roomController.getCategorySpecialRoom,
  )
  .get("/getRoomID", roomController.getRoomIDByProductIDAndRoomType);

router
  .post("/createRoommain", uploadImage.array("image", 1), RoomMain.create)
  .get("/getRoommain", RoomMain.getRoom)
  .get("/getAllRoommain", RoomMain.getRooms)
  .delete("/deleteRoommain/:roomId", RoomMain.deleteRoomById);

router
  .post(
    "/roomType",
    uploadImage.array("image", 1),
    roomTypeController.createRoomType,
  )
  .get("/roomType", roomTypeController.getRoomTypes)
  .delete("/roomType/:roomTypeId", roomTypeController.deleteRoomTypeById);

//  product endpoints 🥼
router
  .post("/createProduct", productController.createProduct)
  .get("/products", productController.fetchAllProducts)
  .get(
    "/getproductbyproductid/:productId",
    productController.fetchProductByProductId,
  )
  .get(
    "/fetchProductsByCategory/:category",
    productController.fetchProductsByCategory,
  )
  .get(
    "/productByCategoryAndSubCategory",
    productController.fetchProductsByCategoryAndSubCategory,
  )
  .patch("/updateDemandType", productController.updateDemandType)
  .patch("/updateSpecialPrice", productController.updateSpecialPrice)
  .get("/productsByRoomType", productController.fetchProductsByRoomType)
  .get("/getSingleProduct", productController.fetchProductByTitle)
  .get("/fetchProductById/:id", productController.fetchProductById)
  .delete("/products/:productId", productController.deleteProductById)
  .get("/getAllProductsByOffer/:type", productController.getAllProductsByOffer)
  .get(
    "/getAllProductsByDemandType/:type",
    productController.getAllProductsByDemandType,
  )
  .post("/requestForProduct", productController.requestForProduct)
  .get(
    "/getAllProductByAuthorId/:id",
    productController.getAllProductByAuthorID,
  )
  .get(
    "/fetchAllReviewByUserId/:userId",
    productController.fetchAllReviewByUserId,
  )
  .patch(
    "/removeSpecialPrice/:productId",
    productController.removeSpecialPrice,
  );
// Review 🌟
router
  .post(
    "/createReview",
    uploadImage.array("image", 4),
    productController.createReview,
  )
  .get("/getReview", productController.getReview)
  .delete("/deleteReview/:reviewId", productController.deleteReview);

// 🗺 map endpoints 🗺
router
  .post("/createMapPlaces", mapController.createMapPlaces)
  .get("/mapPlaces", mapController.getMapPlaces)
  .get("/distance", mapController.getDistance)
  // .get("/searchMapStore", mapController.searchMapStore)
  .delete("/mapPlaces/:mapId", mapController.deleteMapPlaces)
  .get("/calculateShippingDetails", mapController.calculateShippingDetails);

// trending products 📈
router
  .post("/increment-popularity", trendingController.incrementPopularity) // increment the popularity of a product
  .get("/trending-products", trendingController.trendingProducts) // fetch trending products
  .get("/check-database", (req, res) => {
    const dbName = mongoose.connection.db.databaseName;
    const collections = Object.keys(mongoose.connection.collections);
    res.json({
      database: dbName,
      collections: collections,
      message: `Connected to database: ${dbName}`,
    });
  });

// Virtual Experience 🎁
router
  .post("/createVE", VirtualExperience.createVirtualExperiance)
  .post("/getVEFilter", VirtualExperience.virtualExperienceFilterData)
  .get("/getVE", VirtualExperience.getVirtualExperianceFields);

router
  .post(
    "/createSuggestion",
    uploadImage.fields([
      { name: "factorsImage" },
      { name: "mainImage", maxCount: 1 },
      { name: "subHeadingImage1" },
      { name: "subHeadingImage2" },
      { name: "suggestionCardImage", maxCount: 1 },
    ]),
    suggestionController.createSuggestion,
  )
  .get("/fetchAllSuggestions", suggestionController.fetchAllSuggestions)
  .get("/fetchSuggestionById", suggestionController.fetchSuggestionById)
  .get("/fetchSuggestionByTitle", suggestionController.fetchSuggestionByTitle)
  .delete(
    "/deleteSuggestion/:suggestionId",
    suggestionController.deleteSuggestionById,
  )
  .put(
    "/updateFeatures/:suggestionId",
    suggestionController.updateSuggestionFeatures,
  );

// Demand Type
router
  .post("/addProductToDemandType", DemandType.addProductToDemandType)
  .post("/createDemandType", DemandType.createDemandType)
  .get("/getAllDemandTypes", DemandType.getAllDemandTypes)
  .patch("/removeProductFromDemandType", DemandType.removeProductFromDemandType)
  .delete("/deleteDemandType/:type", DemandType.deleteDemandType);

router
  .post("/createOffer", Offers.createGlobalOffer)
  .get("/offer", Offers.getOffer)
  .get("/externalOffers", Offers.getAllExternalOffers)
  .post("/addProductToOffer", Offers.addProductToOffer)
  .get("/getAllOffers", Offers.getAllOffers)
  .get("/getBankOffers", Offers.getBankOffers)
  .get("/allExternalOffers", Offers.getExternalOffers)
  .get(
    "/getExternalOfferApplicablePrice/:userId/:amount",
    Offers.getExternalOfferApplicablePrice,
  )
  .delete("/deleteOffer/:type", Offers.deleteOffer)
  .patch("/removeProductFromOffer", Offers.removeProductFromOffer)
  .post("/createExternalOffer", Offers.createExternalOffer);

router
  .post(
    "/createSpecialReview",
    uploadImage.array("image", 1),
    productController.createSpecialReview,
  )
  .get("/getSpecialReview", productController.getSpecialReview);

//  development purpose only 🍕🍕

// router.post('/saveCategories',controller.saveCategories);
// router.post('/saveCitiesAndHobbies',controller.saveCitiesAndHobbies);

// HashtagPost
router.post("/hashtagPost", hashtagPostController.createHashtagPost);
router.get("/hashtagPost", hashtagPostController.getHashtagPosts);
router.get("/hashtagPost/:id", hashtagPostController.getHashtagPostById);
router.delete("/hashtagPost/:id", hashtagPostController.deleteHashtagPost);
router.patch("/hashtagPost/:id", hashtagPostController.updateHashtagPost);
router.get("/fetchInstagramPosts", hashtagPostController.fetchAndSaveFromAPI);
router.get("/instagram-posts", hashtagPostController.getInstagramPosts);

// Payment
router.post("/makePayment", paymentController.makePayment);
router.post("/paymentcallback/:orderId", paymentController.paymentCallback);

// Stores
router.post("/store", storeController.createStore);
router.get("/store", storeController.getStores);
router.get("/store/:id", storeController.getStoreById);
router.patch("/store/:id", storeController.updateStore);
router.delete("/store/:id", storeController.deleteStore);
router.get("/searchStore", storeController.searchStore);

// User Location
router.post("/userLocation", userLocationController.createUserLocation);
router.get("/userLocation", userLocationController.getUserLocations);
router.get(
  "/userLocation/:deviceId",
  userLocationController.getUserLocationByDeviceId,
);
router.patch(
  "/userLocation/:deviceId",
  userLocationController.updateUserLocation,
);
router.delete(
  "/userLocation/:deviceId",
  userLocationController.deleteUserLocation,
);

// Live Room Admin
router.post("/liveRoomAdmin", liveRoomAdminController.createLiveRoomAdmin);
router.get("/liveRoomAdmin", liveRoomAdminController.getLiveRoomAdmins);
router.get("/liveRoomAdmin/:id", liveRoomAdminController.getLiveRoomAdminById);
router.delete(
  "/liveRoomAdmin/:id",
  liveRoomAdminController.deleteLiveRoomAdmin,
);
router.patch("/liveRoomAdmin/:id", liveRoomAdminController.updateLiveRoomAdmin);
router.get(
  "/getLiveRoomAdminByEmail/:email",
  liveRoomAdminController.getLiveRoomAdminByEmail,
);

// router.post("/createAuthor", authorController.createAuthor);
router.get("/getAuthors", authorController.getAuthors);
router.get("/getAuthor/:id", authorController.getAuthor);
router.get("/getAuthorByEmail/:email", authorController.getAuthor);
// router.delete("/deleteAuthor/:id", authorController.deleteAuthor);
// router.delete(
//   "/deleteAuthorByEmail/:email",
//   authorController.deleteAuthorByEmail
// );
// router.put("/updateAuthor/:id", authorController.updateAuthor);

router.get("/shippingRate", shippingRateController.geShippingRate);
router.post("/shippingRate", shippingRateController.createShippingRate);
router.patch("/shippingRate/:id", shippingRateController.editShippingRate);
router.delete("/shippingRate/:id", shippingRateController.deleteShippingRate);
router.get(
  "/calculateShippingDetails/:distance",
  shippingRateController.calculateShippingDetails,
);

router.patch("/likeProduct", productController.likeProduct);
router.patch("/unlikeProduct", productController.unlikeProduct);
router.post(
  "/generateMaintenanceDetailPdf",
  productController.generateMaintenancePdf,
);
router.post(
  "/generateInstallationDetailPdf",
  productController.generateInstallationPdf,
);

router.get(
  "/getRankedProductsFoEachCategory",
  productController.rankedProductsFoEachCategory,
);

router.post("/createUrgency", urgencyController.createUrgency);
router.get("/getUrgencies", urgencyController.getUrgencies);
router.get("/getUrgency/:type", urgencyController.getUrgency);
router.delete("/deleteUrgency/:type", urgencyController.deleteUrgency);
router.patch("/addUrgencyToProduct", urgencyController.addUrgencyToProduct);

router.get("/getAllCategoryByOffer/:type", Offers.getAllCategoryByOffer);

router.get(
  "/fetchAccessoriesByCategory/:category",
  productController.fetchAccessoriesByCategory,
);

// router.patch("/updateInstallationDetails/:categoryName", controller.updateInstallationDetails);

// Purchase
router.post("/purchase", purchaseController.storePurchase);

// DEBUG: Get image fields for a specific model
router.get(
  "/admin/debug/image-fields/:model",
  /* verifyAdminToken, */
  (req, res) => {
    const { model } = req.params;

    if (!mongoose.modelNames().includes(model)) {
      return res.status(400).json({
        error: "Unknown model",
        model,
        available: mongoose.modelNames(),
      });
    }

    try {
      const Model = mongoose.model(model);
      const tree = Model.schema.tree;
      const imageFields = [];
      const allKeys = Object.keys(tree);

      for (const key of allKeys) {
        const lname = key.toLowerCase();
        if (lname.includes("image") || lname.includes("img")) {
          imageFields.push({
            key,
            type: tree[key].type ? tree[key].type.name : typeof tree[key],
            isArray: Array.isArray(tree[key].type),
          });
        }
      }

      return res.json({
        ok: true,
        model,
        schema_keys: allKeys.slice(0, 20),
        total_schema_keys: allKeys.length,
        image_fields: imageFields,
        image_fields_count: imageFields.length,
        full_tree_keys: allKeys,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
);

// Cleanup old S3 URLs from specific document field
router.post(
  "/admin/cleanup-old-urls/:model/:id/:field",
  /* verifyAdminToken, */
  cleanupController.cleanupOldUrls,
);

// Cleanup URLs matching pattern across all models
router.post(
  "/admin/cleanup-pattern",
  /* verifyAdminToken, */
  cleanupController.cleanupPattern,
);

// DEBUG ENDPOINT: Show which models failed to load
router.get("/admin/debug/model-status", (req, res) => {
  const registered = mongoose.modelNames();
  const modelsToLoad = [
    "admin",
    "Author",
    "bannerSection",
    "Cart",
    "Category",
    "CategoryDescription",
    "CityHobbie",
    "DemandType",
    "ExternalOffer",
    "FreeSampleCart",
    "HashtagPost",
    "Header",
    "imgchanger",
    "ImgGrid",
    "ImgSection",
    "LiveRoomAdmin",
    "mapmodel",
    "MidSection",
    "ModelCategory",
    "newProductSection",
    "Offers",
    "Order",
    "poster",
    "Preferences",
    "ProfileContent",
    "Products",
    "Purchase",
    "RequestedProduct",
    "review",
    "room",
    "RoomMain",
    "roomType",
    "ShippingRate",
    "Slider",
    "SpecialReview",
    "staticSection",
    "Store",
    "Suggestions",
    "Urgency",
    "User",
    "UserLocation",
    "VEModel",
  ];

  const missing = modelsToLoad.filter((m) => !registered.includes(m));

  res.json({
    total_expected: modelsToLoad.length,
    total_registered: registered.length,
    registered_models: registered.sort(),
    missing_models: missing.sort(),
    failed_to_load_count: missing.length,
  });
});

module.exports = router;
