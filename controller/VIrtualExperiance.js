const VitualDB = require("../model/VEModel");
const Products = require("../model/Products");

// GET: "/api/getVE"
const getVirtualExperianceFields = async (req, res) => {
  try {
    const virtualExperiance = await VitualDB.find();
    res.json(virtualExperiance);
  } catch (error) {
    res.json({ message: error });
  }
};

// POST: "/api/getVEFilter"
const virtualExperienceFilterData = async (req, res) => {
  try {
    const filters = req.body;

    // Constructing the query based on the provided filters
    const query = {};

    // Category filter
    if (filters.category) {
      query.category = filters.category;
    }

    // Subcategory filter
    // if (filters.subcategory) {
    //   const selectedSubcategories = Object.entries(filters.subcategory)
    //     .filter(([subcategory, isSelected]) => isSelected)
    //     .map(([subcategory]) => subcategory);
    //   query.subcategory = { $in: selectedSubcategories };
    // }

    // Room filter
    if (filters.room && Object.keys(filters.room).length > 0) {
      const selectedRooms = Object.entries(filters.room)
        .filter(([room, isSelected]) => isSelected)
        .map(([room]) => room);
      query.roomCategory = { $in: selectedRooms };
    }

    // Budget filter
    if (filters.budget) {
      query.perUnitPrice = { $lte: parseInt(filters.budget) };
    }

    // Color filter
    // if (filters.color) {
    //   const selectedColors = Object.entries(filters.color)
    //     .filter(([color, isSelected]) => isSelected)
    //     .map(([color]) => color);

    //   query.colors = { $elemMatch: { $in: selectedColors } };
    // }

    // // Style filter
    // if (filters.style) {
    //   const selectedStyles = Object.entries(filters.style)
    //     .filter(([style, isSelected]) => isSelected)
    //     .map(([style]) => style);
    //   query.style = { $in: selectedStyles };
    // }

    // console.log(query);
    // Execute the query
    const products = await Products.find(query);

    // Send the filtered products as a response
    // console.log("filtered Products", products);
    res.json(products);
  } catch (error) {
    // Handle any errors
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const filterProducts = async ({
  category,
  rooms,
  style,
  subcategory,
  price,
  colors,
}) => {
  let categoryFilter = {};

  switch (category) {
    case "flooring":
    case "wallpaper":
    case "curtains":
      categoryFilter["roomCategory"] = { $in: rooms?.map((r) => r.title) };
      categoryFilter["style.title"] = { $in: style?.map((s) => s.title) };
      categoryFilter["subcategory.title"] = {
        $in: subcategory?.map((sp) => sp.title),
      };
      break;
    default:
      throw new Error("Invalid category");
  }

  let data = await Products.find(categoryFilter);

  data = data.filter(
    (product) =>
      colors.some((color) =>
        product.color.some((c) => c.title === color.title)
      ) && price.some((p) => product.price === p.Label)
  );

  return data;
};

// POST: "/api/createVE"
const createVirtualExperiance = async (req, res) => {
  try {
    const filterData = req.body;
    const newFilterData = await VitualDB.create(filterData);
    res.json(newFilterData);
  } catch (error) {
    res.json({ message: error });
  }
};

module.exports = {
  getVirtualExperianceFields,
  virtualExperienceFilterData,
  createVirtualExperiance,
};
