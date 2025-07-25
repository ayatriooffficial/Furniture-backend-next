const { default: mongoose } = require("mongoose");
const categoriesDB = require("../../model/Category");
const citiesAndHobbiesDB = require("../../model/CityHobbie");
const Product = require("../../model/Products");
const roomsDB = require("../../model/room");
const RoomMain = require("../../model/RoomMain");
const Suggestion = require("../../model/Suggestions");
// At the top of your controller file
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


// GET: api/categories
exports.getCategories = async (req, res) => {
  try {
    let allCategoriesData = await categoriesDB.find();

    // Check if there are no categories found
    if (!allCategoriesData || allCategoriesData.length === 0) {
      return res.status(404).json({ message: "No categories found." });
    }

    res.status(200).send(allCategoriesData);
  } catch (error) {
    res
      .status(500)
      .json({ err: error.message || "Error while getting categories!" });
  }
};

const parseJsonIfString = (value) => {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch (e) {
    return value;
  }
};

function mapTextAndHyperlink(inputArray) {
  return inputArray.map((item) => {
    if (item.selectedtext && item.hyperlink) {
      const updatedText = item.text.replace(
        item.selectedtext,
        `${item.selectedtext}|${item.hyperlink}`
      );
      return updatedText;
    }
    return item.text;
  });
}

exports.createCategory = async (req, res) => {
  try {
    // 1. Extract and validate main image URL
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: "Valid image URL is required" });
    }

    // 2. Process SVG files for features
    const processSVG = async (svgUrl, featureTitle) => {
      try {
        const response = await axios.get(svgUrl, {
          responseType: 'arraybuffer',
          timeout: 10000
        });

        const sanitizedTitle = featureTitle
          .replace(/[^a-zA-Z0-9]/g, '_')
          .toLowerCase();
        const fileName = `features/${sanitizedTitle}_${uuidv4()}.svg`;

        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: fileName,
          Body: response.data,
          ContentType: 'image/svg+xml',
          ACL: 'public-read'
        }));

        return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      } catch (error) {
        console.error(`SVG processing failed for ${featureTitle}:`, error);
        return null;
      }
    };

    // 3. Enhanced pdesc handling
    const handlePdesc = (input) => {
      try {
        // Handle FormData stringified JSON
        if (typeof input === 'string') {
          try {
            const parsed = JSON.parse(input);
            return {
              description: parsed?.description?.toString()?.substring(0, 2000) || ''
            };
          } catch {
            return {
              description: input.toString().substring(0, 2000)
            };
          }
        }
        // Handle direct object input
        return {
          description: input?.description?.toString()?.substring(0, 2000) || ''
        };
      } catch (error) {
        return { description: '' };
      }
    };

    // 4. Extract and sanitize all fields
    const sanitizeString = (value, maxLength = 100) => 
      (value?.toString() || '').substring(0, maxLength).trim();

    const {
      name,
      type,
      description = '',
      h1title = '',
      h1tag = '',
      metadataTitle = '',
      showCalculator = false,
      features = [],
      subcategories = [],
      maintenanceDetails = [],
      installationDetails = [],
      faq = [],
      availableColors = [],
      availableServices = [],
      availableRatingTypes = [],
      firstGrid = {},
      secondGrid = {}
    } = req.body;

    // 5. Validate required fields with better error messages
    if (!sanitizeString(name) || !sanitizeString(type)) {
      return res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "Both 'name' and 'type' fields are required and must be non-empty strings"
      });
    }

    // 6. Process features with error resilience
    const processedFeatures = await Promise.all(
      (Array.isArray(features) ? features : []).map(async (feature) => {
        try {
          const baseFeature = {
            title: sanitizeString(feature?.title, 100) || 'Untitled Feature',
            description: (feature?.description || []).slice(0, 5),
            displayType: ['cardSVG', 'card', 'Tip', 'Comparison'].includes(feature?.displayType)
              ? feature.displayType
              : 'Tip',
            svg: null
          };

          if (baseFeature.displayType === 'cardSVG' && feature?.svg) {
            baseFeature.svg = await processSVG(
              sanitizeString(feature.svg, 500),
              baseFeature.title
            );
          }
          return baseFeature;
        } catch (error) {
          console.error("Error processing feature:", error);
          return null;
        }
      }).filter(Boolean)
    );

    // 7. Process subcategories with safe defaults
    const processedSubCategories = (Array.isArray(subcategories) ? subcategories : [])
      .slice(0, 20)
      .map(sub => ({
        name: sanitizeString(sub?.name, 50) || 'Unnamed Subcategory',
        description: sanitizeString(sub?.description, 500),
        metadata: {
          title: sanitizeString(sub?.metadata?.title, 100)
        },
        img: sanitizeString(sub?.img, 500),
        isAccessories: !!sub?.isAccessories,
        showInSubCategory: sub?.showInSubCategory !== false,
        products: (Array.isArray(sub?.products) ? sub.products : [])
          .slice(0, 50)
          .map(p => ({
            productId: sanitizeString(p?.productId, 100)
          })),
        features: (Array.isArray(sub?.features) ? sub.features : [])
          .slice(0, 20)
          .map(f => ({
            title: sanitizeString(f?.title, 100),
            description: sanitizeString(f?.description, 500),
            displayType: ['cardSVG', 'card', 'Tip', 'Comparison'].includes(f?.displayType)
              ? f.displayType
              : 'Tip',
            svg: sanitizeString(f?.svg, 500)
          })),
        faq: (Array.isArray(sub?.faq) ? sub.faq : [])
          .slice(0, 20)
          .map(f => ({
            heading: sanitizeString(f?.heading, 200),
            description: sanitizeString(f?.description, 1000)
          })),
        h1title: sanitizeString(sub?.h1title, 100),
        pdesc: handlePdesc(sub?.pdesc)
      }));

    // 8. Build final category object with safety checks
    const newCategory = new categoriesDB({
      name: sanitizeString(name, 100),
      image: sanitizeString(image, 500),
      h1tag: sanitizeString(h1tag, 100),
      subcategories: processedSubCategories,
      type: sanitizeString(type, 50),
      description: sanitizeString(description, 2000),
      h1title: sanitizeString(h1title, 100),
      metadata: {
        title: sanitizeString(metadataTitle, 100)
      },
      showCalculator: !!showCalculator,
      features: processedFeatures.filter(Boolean),
      pdesc: handlePdesc(req.body.pdesc),
      maintenanceDetails: (Array.isArray(maintenanceDetails) ? maintenanceDetails : [])
        .slice(0, 20)
        .map(md => ({
          heading: sanitizeString(md?.heading, 200),
          description: sanitizeString(md?.description, 1000)
        })),
      installationDetails: (Array.isArray(installationDetails) ? installationDetails : [])
        .slice(0, 20)
        .map(id => ({
          heading: sanitizeString(id?.heading, 200),
          description: sanitizeString(id?.description, 1000)
        })),
      faq: (Array.isArray(faq) ? faq : [])
        .slice(0, 20)
        .map(f => ({
          heading: sanitizeString(f?.heading, 200),
          description: sanitizeString(f?.description, 1000)
        })),
      availableColors: (Array.isArray(availableColors) ? availableColors : [])
        .slice(0, 50)
        .map(c => ({
          name: sanitizeString(c?.name, 50),
          hexCode: (c?.hexCode?.match(/^#[0-9A-Fa-f]{6}/)?.[0] || '#000000').substring(0, 7)
        })),
      availableServices: (Array.isArray(availableServices) ? availableServices : [])
        .slice(0, 50)
        .map(s => ({
          name: sanitizeString(s?.name, 50),
          cost: Math.min(Number(s?.cost) || 0, 1000000),
          unitType: sanitizeString(s?.unitType, 20)
        })),
      availableRatingTypes: (Array.isArray(availableRatingTypes) ? availableRatingTypes : [])
        .slice(0, 50)
        .map(rt => ({
          name: sanitizeString(rt?.name, 50),
          image: sanitizeString(rt?.image, 500)
        })),
      firstGrid: {
        title: sanitizeString(firstGrid?.title, 100),
        description: sanitizeString(firstGrid?.description, 500),
        link: sanitizeString(firstGrid?.link, 500),
        image: sanitizeString(firstGrid?.image, 500)
      },
      secondGrid: {
        title: sanitizeString(secondGrid?.title, 100),
        description: sanitizeString(secondGrid?.description, 500),
        link: sanitizeString(secondGrid?.link, 500),
        image: sanitizeString(secondGrid?.image, 500)
      }
    });

    // 9. Save to database with error handling
    await newCategory.save();

    // 10. Return consistent success response
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      categoryId: newCategory._id,
      name: newCategory.name
    });

  } catch (error) {
    console.error("Category creation error:", error);
    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 400 ? "Validation Error" : "Internal Server Error",
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

exports.updatePdescCategoryById = async (req, res) => {
  try {
    const { categoryId, pdesc } = req.body;
    // //console.log("Requested pdesc:", pdesc);

    if (!categoryId) {
      return res.status(400).json({ error: "Category ID is required." });
    }

    if (!Array.isArray(pdesc) || pdesc.length === 0) {
      return res
        .status(400)
        .json({ error: "pdesc must be a non-empty array." });
    }
    if (pdesc.length > 1) {
      return res
        .status(400)
        .json({ error: "Only the first element of pdesc can be updated." });
    }

    //here

    const mapTextAndHyperlink = (inputArray) => {
      return inputArray.map((item) => {
        if (item.selectedText && item.hyperlink) {
          const updatedText = item.text.replace(
            item.selectedText,
            `${item.selectedText}|${item.hyperlink}`
          );
          return updatedText;
        }
        return item.text || "";
      });
    };

    const mappedPdesc = mapTextAndHyperlink(pdesc);

    const category = await categoriesDB.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found." });
    }

    if (category.pdesc.length > 0) {
      category.pdesc[0] = mappedPdesc[0];
    } else {
      return res.status(400).json({ error: "pdesc[0] does not exist." });
    }

    await category.save();

    res.status(200).json({
      message: "Category pdesc[0] updated successfully.",
      category: category,
    });
  } catch (error) {
    console.error("Error updating category pdesc:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
};

//add features in a category
exports.addCategoryFeatures = async (req, res) => {
  try {
    const { categoryId, feature } = req.body;
    // //console.log(req.body);

    if (!categoryId || !feature) {
      return res.status(400).json({ 
        error: "Category ID and feature are required." 
      });
    }

    if (!["cardSVG", "card", "Tip", "Comparison"].includes(feature.displayType)) {
      return res.status(400).json({ error: "Invalid displayType" });
    }

    const newFeature = { ...feature };

    if (newFeature.displayType === "cardSVG") {
      if (!feature.svg) {
        return res.status(400).json({ error: "svgUrl required for cardSVG type" });
      }

      try {
        // Download SVG from URL
        const response = await axios({
          method: "get",
          url: feature.svg,
          responseType: "arraybuffer",
          timeout: 10000
        });

        // Generate S3 file name
        const sanitizedTitle = feature.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `features/${sanitizedTitle}_${uuidv4()}.svg`;

        // Upload to S3
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: fileName,
          Body: Buffer.from(response.data),
          ContentType: 'image/svg+xml',
          ACL: "public-read",
        }));

        newFeature.svg = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      } catch (error) {
        console.error("SVG processing failed:", error);
        return res.status(422).json({ 
          error: `Failed to process SVG: ${error.message}`,
          ...(error.response && { details: error.response.data })
        });
      }
    }

    const category = await categoriesDB.findById(categoryId);
    if (!category) return res.status(404).json({ error: "Category not found." });
    // //console.log(newFeature);
    category.features.push(newFeature);
    const savedCategory = await category.save();

    res.status(200).json({
      message: "Feature added successfully.",
      features: savedCategory.features,
    });
  } catch (error) {
    console.error("Error adding features:", error);
    res.status(500).json({ 
      error: error.message || "Internal server error",
      ...(error.response && { details: error.response.data })
    });
  }
};

//delete features
exports.deleteCategoryFeatures = async (req, res) => {
  try {
    const { categoryId, featureId } = req.params;
    // //console.log(
    //   "Received categoryId:",
    //   categoryId,
    //   "and featureId:",
    //   featureId
    // );

    if (
      !mongoose.Types.ObjectId.isValid(categoryId) ||
      !mongoose.Types.ObjectId.isValid(featureId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid categoryId or featureId format." });
    }

    const category = await categoriesDB.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    const featureIndex = category.features.findIndex(
      (feature) => feature._id.toString() === featureId.toString()
    );
    if (featureIndex === -1) {
      return res.status(404).json({ message: "Feature not found" });
    }
    category.features.splice(featureIndex, 1);

    await category.save();

    res.status(200).json({
      message: "Feature deleted successfully",
      features: category.features,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.getCategoryFaq = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await categoriesDB.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found." });
    }
    res.status(200).json({ faq: category.faq || [] });
  } catch (error) {
    console.error("Error fetching category FAQ:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
};

//delete faq
exports.deleteFaq = async (req, res) => {
  try {
    const { categoryId, faqId } = req.params;

    const category = await categoriesDB.findById(categoryId);
    if (!category) {
      //console.log("Category not found");
      return res.status(404).json({ error: "Category not found." });
    }

    const faqIndex = category.faq.findIndex(
      (faq) => faq._id.toString() === faqId
    );
    if (faqIndex === -1) {
      //console.log("FAQ not found in category");
      return res.status(404).json({ error: "FAQ not found." });
    }

    category.faq.splice(faqIndex, 1);
    await category.save();
    // //console.log("FAQ deleted successfully");

    res.status(200).json({
      message: "FAQ deleted successfully.",
      data: { faq: category?.faq },
    });
  } catch (error) {
    console.error("Error in deleteFaq controller:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
};
exports.deleteSubCategoryFaq = async (req, res) => {
  try {
    const { categoryId, subCategoryId, faqId } = req.params;

    const category = await categoriesDB.findById(categoryId);
    if (!category) {
      //console.log("Category not found");
      return res.status(404).json({ error: "Category not found." });
    }

    const subCategory = category.subcategories.id(subCategoryId);
    if (!subCategory) {
      //console.log("Subcategory not found");
      return res.status(404).json({ error: "Subcategory not found." });
    }

    const faqIndex = subCategory.faq.findIndex(
      (faq) => faq._id.toString() === faqId
    );
    if (faqIndex === -1) {
      //console.log("FAQ not found in category");
      return res.status(404).json({ error: "FAQ not found." });
    }

    subCategory.faq.splice(faqIndex, 1);
    await category.save();
    //console.log("FAQ deleted successfully");

    res.status(200).json({ message: "FAQ deleted successfully.", subCategory });
  } catch (error) {
    console.error("Error in deleteFaq controller:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
};
exports.deleteSubCategoryFeature = async (req, res) => {
  try {
    const { categoryId, subCategoryId, featureId } = req.params;

    const category = await categoriesDB.findById(categoryId);
    if (!category) {
      //console.log("Category not found");
      return res.status(404).json({ error: "Category not found." });
    }

    const subCategory = category.subcategories.id(subCategoryId);
    if (!subCategory) {
      //console.log("Subcategory not found");
      return res.status(404).json({ error: "Subcategory not found." });
    }

    const featureIndex = subCategory.features.findIndex(
      (feature) => feature._id.toString() === featureId
    );
    if (featureIndex === -1) {
      //console.log("Feature not found in category");
      return res.status(404).json({ error: "Feature not found." });
    }

    subCategory.features.splice(featureIndex, 1);
    await category.save();
    //console.log("Feature deleted successfully");

    res
      .status(200)
      .json({ message: "Feature deleted successfully.", subCategory });
  } catch (error) {
    console.error("Error in delete Feature controller:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
};
exports.deleteSubCategoryProduct = async (req, res) => {
  try {
    const { categoryId, subCategoryId, productId } = req.params;

    const category = await categoriesDB.findById(categoryId);
    if (!category) {
      //console.log("Category not found");
      return res.status(404).json({ error: "Category not found." });
    }

    const subCategory = category.subcategories.id(subCategoryId);
    if (!subCategory) {
      //console.log("Subcategory not found");
      return res.status(404).json({ error: "Subcategory not found." });
    }

    const productIndex = subCategory.products.findIndex(
      (product) => product._id.toString() === productId
    );
    if (productIndex === -1) {
      //console.log("product not found in category");
      return res.status(404).json({ error: "Feature not found." });
    }

    subCategory.products.splice(productIndex, 1);
    await category.save();
    //console.log("product deleted successfully");

    res
      .status(200)
      .json({ message: "product deleted successfully.", subCategory });
  } catch (error) {
    console.error("Error in delete product controller:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
};

exports.addFaqToCategory = async (req, res) => {
  try {
    // //console.log("Request Body:", req.body);
    const { categoryId } = req.params;
    const { heading, description, linkText } = req.body; // Fixed: changed linkTexT to linkText

    if (!categoryId || !heading) {
      return res.status(400).json({ 
        error: "Category ID and heading are required." 
      });
    }

    const newFaq = {
      heading,
      description: description || "",
      linkText: Array.isArray(linkText) ? linkText : [] 
    };

    if (newFaq.linkText.length > 0) {
      for (const link of newFaq.linkText) {
        if (!link.text || !link.link) {
          return res.status(400).json({
            error: "Both text and link are required for linkText items"
          });
        }
      }
    }

    const category = await categoriesDB.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found." });
    }

    category.faq = category.faq || [];
    category.faq.push(newFaq);
    await category.save();

    res.status(200).json({
      message: "FAQ added successfully",
      data: { faq: newFaq },
      success: true
    });

  } catch (error) {
    console.error("Error adding FAQ:", error);
    res.status(500).json({ 
      error: error.message || "Internal server error",
      success: false 
    });
  }
};
exports.getCategoryByName = async (req, res) => {
  try {
    const { categoryName } = req.params;

    const category = await categoriesDB.findOne({
      name: categoryName,
    });

    // //console.log("req",req)
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }
    const filteredCategories = {
      ...category._doc,
      subcategories: category.subcategories.filter(
        (subcategory) => subcategory.showInSubCategory === true
      ),
    };

    res.status(200).send(filteredCategories);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.getCategoryWithSubCategoryByName = async (req, res) => {
  try {
    const { categoryName } = req.params;

    const category = await categoriesDB.findOne({
      name: categoryName,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }
    res.status(200).send(category);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.updateCategoryMetadata = async (req, res) => {
  try {
    // //console.log("Request Body:", req.body);
    const { categoryName } = req.params;
    // //console.log("Received:", categoryName);
    const { metadataTitle } = req.body;
    const { h1Tag } = req.body;

    // //console.log("Received:", { categoryName, metadataTitle });
    // //console.log("Received h1tag:", h1Tag);

    const category = await categoriesDB.findOneAndUpdate(
      { name: { $regex: new RegExp(categoryName, "i") } },
      { metadata: { title: metadataTitle }, h1tag: h1Tag },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    res
      .status(200)
      .json({ message: "Category metadata updated successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.updateCategoryh1title = async (req, res) => {
  try {
    const { categoryName } = req.params;
    const { h1title } = req.body;

    // //console.log("Received:", { categoryName, h1title });

    const category = await categoriesDB.findOneAndUpdate(
      { name: { $regex: new RegExp(categoryName, "i") } },
      { h1title },
      { new: true }
    );

    if (!category) {
      //console.log("Category not found for name:", categoryName);
      return res.status(404).json({ message: "Category not found." });
    }

    // //console.log("Updated Category:", category);

    res.status(200).json({ message: "Category h1title updated successfully." });
  } catch (error) {
    console.error("Error updating h1title:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.updateSubCategoryField = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params; // Extract IDs from request parameters
    const { field, value } = req.body; // Extract field name and its new value from the request body

    // Validation
    if (!field || value === undefined) {
      return res
        .status(400)
        .json({ message: "Field name and value are required." });
    }

    // //console.log("Received:", { categoryId, subCategoryId, field, value });

    // Fetch the category by ID
    let category = await categoriesDB.findById(categoryId);

    if (!category) {
      //console.log("Category not found for Id:", categoryId);
      return res.status(404).json({ message: "Category not found." });
    }

    // //console.log(category);

    // Find the specific subcategory
    const subCategory = category.subcategories?.find(
      (item) => item._id.toString() === subCategoryId
    );

    if (!subCategory) {
      //console.log("Subcategory not found for Id:", subCategoryId);
      return res.status(404).json({ message: "Subcategory not found." });
    }

    subCategory[field] = value;
    // Save changes to the database
    await category.save();

    res.status(200).json({
      message: `Subcategory field '${field}' updated successfully.`,
      subCategory,
    });
  } catch (error) {
    console.error("Error updating subcategory field:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.updateSubCategoryh1title = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    const { h1title } = req.body;

    if (!h1title) {
      return res.status(400).json({ message: "h1title is required." });
    }

    // //console.log("Received:", { categoryId, subCategoryId, h1title });

    // Fetch the category by ID
    let category = await categoriesDB.findById(categoryId);

    if (!category) {
      // //console.log("Category not found for Id:", categoryId);
      return res.status(404).json({ message: "Category not found." });
    }

    const subCategory = category.subcategories?.find(
      (item) => item._id.toString() === subCategoryId
    );

    if (!subCategory) {
      //console.log("Subcategory not found for Id:", subCategoryId);
      return res.status(404).json({ message: "Subcategory not found." });
    }

    // Update the h1title
    subCategory.h1title = h1title;

    await category.save();

    res.status(200).json({
      message: "Subcategory h1title updated successfully.",
    });
  } catch (error) {
    console.error("Error updating h1title:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
exports.updateSubCategorypdesc = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    const { pdesc } = req.body;

    if (!pdesc) {
      return res.status(400).json({ message: "pdesc is required." });
    }

    // //console.log("Received:", { categoryId, subCategoryId, pdesc });

    // Fetch the category by ID
    let category = await categoriesDB.findById(categoryId);

    if (!category) {
      // //console.log("Category not found for Id:", categoryId);
      return res.status(404).json({ message: "Category not found." });
    }

    // Find and update the subcategory
    const subCategory = category.subcategories?.find(
      (item) => item._id.toString() === subCategoryId
    );

    if (!subCategory) {
      //console.log("Subcategory not found for Id:", subCategoryId);
      return res.status(404).json({ message: "Subcategory not found." });
    }

    subCategory.pdesc = pdesc;

    await category.save();

    res.status(200).json({
      message: "Subcategory pdesc updated successfully.",
      updatedSubCategory: subCategory,
    });
  } catch (error) {
    console.error("Error updating pdesc:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.updatePdescCategoryByName = async (req, res) => {
  try {
    const { categoryName, pdescInfo } = req.body;
    // //console.log("Requested pdesc:", pdescInfo);

    if (!categoryName) {
      return res.status(400).json({ error: "Category name is required." });
    }

    if (!pdescInfo || !pdescInfo.description) {
      return res
        .status(400)
        .json({ error: "pdesc must be a non-empty array." });
    }

    const updatedCategory = await categoriesDB.findOneAndUpdate(
      { name: { $regex: new RegExp(categoryName, "i") } },
      { pdesc: pdescInfo },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: "Category not found." });
    }

    res.status(200).json({
      message: "Category pdesc updated successfully.",
      pdesc: updatedCategory?.pdesc,
    });
  } catch (error) {
    console.error("Error updating category pdesc:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
};

exports.getCategoriesByType = async (req, res) => {
  try {
    const { type } = req.params;

    const categories = await categoriesDB.find({
      type: { $regex: new RegExp(type, "i") },
    });

    if (!categories) {
      return res.status(404).json({ message: "Categories not found." });
    }

    // sort subcategories by popularity

    categories.forEach((category) => {
      category.subcategories.sort((a, b) => b.popularity - a.popularity);
    });

    //Filter subcategories that are set to show in subcategory

    const filteredCategories = categories.map((category) => {
      const subcategories = category.subcategories.filter(
        (subcategory) => subcategory.showInSubCategory === true
      );
      category.subcategories = subcategories;
      return category;
    });

    res.status(200).send(filteredCategories);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.getSubCategories = async (req, res) => {
  try {
    const { categoryName } = req.params;

    const category = await categoriesDB.findOne({
      name: categoryName,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    //Filter subcategories that are set to show in subcategory

    const subcategories = category.subcategories.filter(
      (subcategory) => subcategory.showInSubCategory === true
    );

    res.status(200).send(subcategories);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// GET: api/citiesAndHobbies
exports.getCitiesAndHobbies = async (req, res) => {
  try {
    const citiesAndHobbie = await citiesAndHobbiesDB.find();

    // Check if there are no categories found
    if (!citiesAndHobbie || citiesAndHobbie.length === 0) {
      return res.status(404).json({ message: "No categories found." });
    }

    res.status(200).send(citiesAndHobbie);
  } catch (error) {
    res.status(500).json({
      err: error.message || "Error while getting cities and hobbies!",
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;

    const category = await categoriesDB.findOneAndDelete({
      name: categoryName,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }
    // find all products with the same category and delete them
    await Product.deleteMany({ category: categoryName });
    await roomsDB.deleteMany({ productCategory: categoryName });

    res.status(200).json({ message: "Category deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.DeleteSubCategory = async (req, res) => {
  const { categoryId, subcategoryId } = req.params;
  try {
    const category = await categoriesDB.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    category.subcategories.pull({ _id: subcategoryId });
    await category.save();
    await Product.deleteMany({ subcategory: subcategory.name });

    res.status(200).json({ message: "Deleted subcategory successfully" });
  } catch (err) {
    console.error("Error details:", JSON.stringify(err, null, 2));
    res.status(400).send({ error: err.message });
  }
};

exports.CreateSubCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const {
      name,
      description,
      h1title,
      pdesc,
      metadataTitle,
      isAccessories,
      showInSubCategory,
      features,
      faq,
    } = req.body;

    const image = req.files?.image;
    if (!image || image.length === 0) {
      return res.status(400).json({ message: "Image is required" });
    }
    const imageUrl = image[0].location;

    const category = await categoriesDB.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const newSubcategory = {
      name: name.trim(),
      img: imageUrl,
      faq: faq || [],
      description: description?.trim() || "",
      h1title: h1title?.trim() || "",
      pdesc: pdesc || [],
      metadata: { title: metadataTitle?.trim() || "" },
      isAccessories: isAccessories || false,
      showInSubCategory: showInSubCategory || true,
      features: features || [],
      _id: new mongoose.Types.ObjectId(),
    };

    category.subcategories.push(newSubcategory);
    // //console.log("New Subcategory:", newSubcategory);

    await category.save();

    res.status(201).json({
      newSubcategory,
      message: "Created subcategory successfully",
    });
  } catch (err) {
    console.error("Error saving subcategory:", err);
    res.status(500).json({
      error: "An error occurred while creating the subcategory.",
      details: err.message,
    });
  }
};

//add features
exports.addsubCategoryFeatures = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    const { features } = req.body;

    if (!features || !Array.isArray(features)) {
      return res.status(400).json({
        message: "Features must be provided as an array of objects.",
      });
    }

    const processedFeatures = await Promise.all(features.map(async (feature) => {
      const newFeature = {
        title: feature.title,
        description: feature.description,
        displayType: feature.displayType || "Tip"
      };

      if (newFeature.displayType === "cardSVG") {
        if (!feature.svgUrl) {
          throw new Error("SVG URL required for cardSVG features");
        }

        try {
          // Download SVG from URL
          const response = await axios({
            method: "get",
            url: feature.svgUrl,
            responseType: "arraybuffer",
            timeout: 10000
          });

          // Generate S3 file name
          const sanitizedTitle = feature.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const fileName = `features/${sanitizedTitle}_${uuidv4()}.svg`;

          // Upload to S3
          await s3Client.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileName,
            Body: Buffer.from(response.data),
            ContentType: 'image/svg+xml',
            ACL: "public-read",
          }));

          newFeature.svg = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        } catch (error) {
          console.error(`Failed to process SVG for feature: ${feature.title}`, error);
          throw new Error(`SVG processing failed: ${error.message}`);
        }
      }

      return newFeature;
    }));

    const category = await categoriesDB.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const subCategory = category.subcategories.id(subCategoryId);
    if (!subCategory) return res.status(404).json({ message: "Subcategory not found" });

    subCategory.features.push(...processedFeatures);
    await category.save();

    res.status(200).json({
      message: "Features added successfully.",
      updatedSubCategory: subCategory,
    });
  } catch (error) {
    console.error(error);
    const statusCode = error.message.includes("SVG processing") ? 422 : 500;
    res.status(statusCode).json({ 
      error: error.message || "Internal server error",
      ...(error.response && { details: error.response.data })
    });
  }
};

//delete features
exports.deletesubCategoryFeatures = async (req, res) => {
  try {
    const { categoryId, subCategoryId, featureId } = req.params;

    // Validate featureId
    if (!featureId || !mongoose.Types.ObjectId.isValid(featureId)) {
      return res.status(400).json({
        message: "Invalid featureId format.",
      });
    }

    // Find the category
    const category = await categoriesDB.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Find the subcategory
    const subCategory = category.subcategories.id(subCategoryId);
    if (!subCategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    // Find the feature index
    const featureIndex = subCategory.features.findIndex(
      (feature) => feature._id.toString() === featureId.toString()
    );

    // If feature not found
    if (featureIndex === -1) {
      return res.status(404).json({ message: "Feature not found" });
    }

    // Remove the feature from the subcategory
    subCategory.features.splice(featureIndex, 1);

    // Save the updated category
    await category.save();

    // Respond with success message and updated subcategory
    res.status(200).json({
      message: "Feature deleted successfully.",
      updatedSubCategory: subCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.getSubCategoryDetailByCategoryAndSubCategoryName = async (req, res) => {
  const { categoryName, subCategoryName } = req.query;
  try {
    const category = await categoriesDB
      .findOne({ name: categoryName })
      .select("subcategories");
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subCategory = category.subcategories.find(
      (subCategory) => subCategory.name === subCategoryName
    );

    if (!subCategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    res.status(200).send(subCategory);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.getallProductsBySubCategory = async (req, res) => {
  const { categoryName, subCategoryName } = req.query;

  // //console.log(categoryName, subCategoryName)
  try {
    // Find all products by category
    const products = await Product.find({ category: categoryName });

    // Filter products by subcategory
    const filteredProducts = products.filter((product) =>
      product.subcategory.includes(subCategoryName)
    );

    res.json(filteredProducts);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Error fetching data" });
  }
};

exports.updateCategoryFirstGrid = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const firstImage = req.files.firstImage;

    const { firstGrid } = req.body;

    const mappedFirstGrid = {
      title: firstGrid.title || null,
      description: firstGrid.description || null,
      link: firstGrid.link || null,
      image: firstImage ? firstImage[0].location : null,
    };
    const category = await categoriesDB.findByIdAndUpdate(
      categoryId,
      { firstGrid: mappedFirstGrid },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    res
      .status(200)
      .json({ message: "Category First grid updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
};

exports.updateCategorySecondGrid = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const secondImage = req.files.secondImage;

    const { secondGrid } = req.body;

    const mappedSecondGrid = {
      title: secondGrid.title || null,
      description: secondGrid.description || null,
      link: secondGrid.link || null,
      image: secondImage ? secondImage[0].location : null,
    };
    const category = await categoriesDB.findByIdAndUpdate(
      categoryId,
      { secondGrid: mappedSecondGrid },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    res
      .status(200)
      .json({ message: "Category second grid updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
};

exports.deleteCategoryFirstGrid = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await categoriesDB.findByIdAndUpdate(
      categoryId,
      { firstGrid: null },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    res.status(200).json({ message: "Category grid removed successfully." });
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
};
exports.deleteCategorySecondGrid = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await categoriesDB.findByIdAndUpdate(
      categoryId,
      { secondGrid: null },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    res.status(200).json({ message: "Category grid removed successfully." });
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
};

exports.checkKeyword = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: "Keyword is required." });
    }

    const isCategory = !!(await categoriesDB.findOne({ name: keyword }));

    if (isCategory) {
      return res.status(200).json({ type: "category" });
    }

    const category = await categoriesDB.findOne({
      "subcategories.name": keyword,
    });

    const isSubCategory = !!category;

    if (isSubCategory) {
      return res
        .status(200)
        .json({ type: "subcategory", parentCategory: category.name });
    }

    const room = await RoomMain.findOne({
      roomType: keyword,
    });

    const isRoom = !!room;

    if (isRoom) {
      return res.status(200).json({ type: "room" });
    }

    const suggestion = await Suggestion.findOne({
      heading: keyword,
    });

    const isSuggestion = !!suggestion;

    if (isSuggestion) {
      return res.status(200).json({ type: "suggestion" });
    }

    res.status(200).json({ type: null });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
