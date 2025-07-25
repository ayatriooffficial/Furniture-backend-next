const categoriesDB = require("../../model/Category");
const citiesAndHobbiesDB = require("../../model/CityHobbie");

exports.saveCategories = async (req, res) => {
  try {
    const { categories } = req.body;

    // Validate the request body against the schema
    const newProduct = new categoriesDB({ categories });
    const savedProduct = await newProduct.save();

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.saveCitiesAndHobbies = async (req, res) => {
  try {
    const data = req.body;
    // console.log(data);

    // Validate the request body against the schema
    const newData = new citiesAndHobbiesDB(data);
    const savedData = await newData.save();

    res.status(201).json(savedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




exports.getCategories = async (req,res) =>{
  try {
    const allCategoriesData = await categoriesDB.find();

     // Check if there are no categories found
     if (!allCategoriesData || allCategoriesData.length === 0) {
      return res.status(404).json({ message: "No categories found." });
    }

    res.status(200).send(allCategoriesData);

  } catch (error) {
    res.status(500).json({ err: error.message || "Error while getting categories!" });
  }
}

// POST: api/createProduct
exports.createProduct = async (req,res)=>{
  try {
    if(!req.body){
      return res.status(406).send("Please provide product data");
    }

    const product = req.body;

    // const newProduct =  new productsDB(product);

    const productData = await productsDB.insertMany(product);

    res.status(201).send(productData)
  } catch (error) {
    res.status(500).json({ err: error.message || "Error while creating new product!" });
  }
}

// GET: api/citiesAndHobbies
exports.getCitiesAndHobbies = async (req,res)=>{
  try {
    const citiesAndHobbie = await citiesAndHobbiesDB.find();

     // Check if there are no categories found
     if (!citiesAndHobbie || citiesAndHobbie.length === 0) {
      return res.status(404).json({ message: "No categories found." });
    }

    res.status(200).send(citiesAndHobbie);
  } catch (error) {
    res.status(500).json({ err: error.message || "Error while getting cities and hobbies!" });
  }
}


// GET: api/getRecommendation
exports.getRecommendation = async (req, res) => {
  try {
    const deviceId = req.query.deviceId;

    const userPreferences = await preferencesDB.find({ deviceId });

    if (!userPreferences || userPreferences.length === 0) {
      // Handle the case where no preferences are found for the given device ID
      return res.status(404).json({ error: 'Preferences not found' });
    }

    const { preferredCities, preferredHobbies, preferredCategories } = userPreferences[0];


    // console.log(preferredCities, preferredHobbies, preferredCategories);

// Function to capitalize the first letter of each word
const capitalize = (str) => {
  return str.replace(/\b\w/g, (match) => match.toUpperCase());
};

// Build an array of query conditions based on preferredCategories
const categoryQueries = preferredCategories.map(category => {
  const subcategories = Array.isArray(category.subcategories) ? category.subcategories : [category.subcategories];
  
  // Capitalize category and subcategory names
  const capitalizedCategory = capitalize(category.name);
  const capitalizedSubcategories = subcategories.map(subcategory => capitalize(subcategory));
  
  // console.log('Processing category:', capitalizedCategory, 'with subcategories:', capitalizedSubcategories);
  
  return {
    category: capitalizedCategory,
    subcategory: { $in: capitalizedSubcategories }
  };
});

// console.log('categoryQueries:', categoryQueries);

    // console.log({ $or: categoryQueries });
    const subcategoriesArray = preferredCategories.flatMap(category => category.subcategory);
// console.log(subcategoriesArray);

    // Use $or to match any of the conditions
    const products = await productsDB.find({ $or:  
      [ { subcategory: { $regex: new RegExp(subcategoriesArray, "i") } }, ]
    });
    
    // Sending the response as an object
    res.json(products);

  } catch (error) {
    console.error(error);
    // Handle other errors
    res.status(500).json({ error: 'Internal Server Error' });
  }
};