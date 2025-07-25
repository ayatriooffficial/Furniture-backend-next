const Product = require("../model/Products");
const suggestionDB = require("../model/Suggestions");
const Room = require("../model/room");
const UserDB = require("../model/User");

exports.createSuggestion = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(406).send("Please provide product data");
    }

    const {
      heading,
      summary,
      shortSummary,
      fiveRooms,
      fiveGridHeader,
      fiveGridDescription,
      twoRooms,
      twoGridHeader,
      twoGridDescription,
      firstSlider,
      secondSlider,
      thirdSlider,
      forthSlider,
      fifthSlider,
      metadataTitle,
      mainImage,
      position,
      features,
      authorId,
    } = req.body;

    const fiveGridRooms = [];

    for (let data of fiveRooms) {
      const room = await Room.findById(data);
      if (room) {
        fiveGridRooms.push(room._id);
      } else {
        //console.log(`Room not found in fiveRooms.`);
        return res.status(404).json({ message: "Room not found in fiveRooms" });
      }
    }

    const twoGridRooms = [];
    for (let data of twoRooms) {
      const room = await Room.findById(data);
      if (room) {
        twoGridRooms.push(room._id);
      } else {
        //console.log(`Room not found in fiveRooms.`);
        return res.status(404).json({ message: "Room not found in fiveRooms" });
      }
    }

    if (authorId) {
      const validAuthor = await UserDB.findById(authorId);
      if (!validAuthor) {
        return res.status(404).json({ message: "Author not found" });
      }
    }

    const mappedFiveGrid = {
      fiveGridHeader,
      fiveGridDescription,
      fiveGridRooms,
    };

    const mappedTwoGrid = {
      twoGridHeader,
      twoGridDescription,
      twoGridRooms,
    };

    // mainImage
    const validMainRoom = await Room.findById(mainImage);
    if (!validMainRoom) {
      //console.log(`Room not found in mainRoom.`);
      return res.status(404).json({ message: "Room not found in mainRoom" });
    }

    let firstSliderProducts = [];
    if (firstSlider.type === "Offer") {
      const products = await Product.find({ offer: firstSlider.subType });
      products.forEach((product) => {
        firstSliderProducts.push(product._id);
      });
    } else if (firstSlider.type === "Category") {
      const products = await Product.find({ category: firstSlider.subType });
      products.forEach((product) => {
        firstSliderProducts.push(product._id);
      });
    } else if (firstSlider.type === "Demand Type") {
      const products = await Product.find({ demandtype: firstSlider.subType });
      products.forEach((product) => {
        firstSliderProducts.push(product._id);
      });
    }

    let secondSliderProducts = [];
    if (secondSlider.type === "Offer") {
      const products = await Product.find({ offer: secondSlider.subType });
      products.forEach((product) => {
        secondSliderProducts.push(product._id);
      });
    } else if (secondSlider.type === "Category") {
      const products = await Product.find({ category: secondSlider.subType });
      products.forEach((product) => {
        secondSliderProducts.push(product._id);
      });
    } else if (secondSlider.type === "Demand Type") {
      const products = await Product.find({ demandtype: secondSlider.subType });
      products.forEach((product) => {
        secondSliderProducts.push(product._id);
      });
    }

    let thirdSliderProducts = [];
    if (thirdSlider.type === "Offer") {
      const products = await Product.find({ offer: thirdSlider.subType });
      products.forEach((product) => {
        thirdSliderProducts.push(product._id);
      });
    } else if (thirdSlider.type === "Category") {
      const products = await Product.find({ category: thirdSlider.subType });
      products.forEach((product) => {
        thirdSliderProducts.push(product._id);
      });
    } else if (thirdSlider.type === "Demand Type") {
      const products = await Product.find({ demandtype: thirdSlider.subType });
      products.forEach((product) => {
        thirdSliderProducts.push(product._id);
      });
    }

    let forthSliderProducts = [];
    if (forthSlider.type === "Offer") {
      const products = await Product.find({ offer: forthSlider.subType });
      products.forEach((product) => {
        forthSliderProducts.push(product._id);
      });
    } else if (forthSlider.type === "Category") {
      const products = await Product.find({ category: forthSlider.subType });
      products.forEach((product) => {
        forthSliderProducts.push(product._id);
      });
    } else if (forthSlider.type === "Demand Type") {
      const products = await Product.find({ demandtype: forthSlider.subType });
      products.forEach((product) => {
        forthSliderProducts.push(product._id);
      });
    }
    let fifthSliderProducts = [];
    if (fifthSlider.type === "Offer") {
      const products = await Product.find({ offer: fifthSlider.subType });
      products.forEach((product) => {
        fifthSliderProducts.push(product._id);
      });
    } else if (fifthSlider.type === "Category") {
      const products = await Product.find({ category: fifthSlider.subType });
      products.forEach((product) => {
        fifthSliderProducts.push(product._id);
      });
    } else if (fifthSlider.type === "Demand Type") {
      const products = await Product.find({ demandtype: fifthSlider.subType });
      products.forEach((product) => {
        fifthSliderProducts.push(product._id);
      });
    }

    const processedFeatures = features
      ? features.map((feature) => ({
          name: feature.name,
          cards:feature.cards,
          description: feature.description,
          displayType: feature.displayType || "tips", // Default to tips if not specified
          icon: feature.icon || null,
        }))
      : [];

    const newSuggestion = new suggestionDB({
      heading,
      summary,
      shortSummary,
      mainImage: validMainRoom._id,
      fiveGrid: mappedFiveGrid,
      twoGrid: mappedTwoGrid,

      position,
      firstSlider: {
        header: firstSlider.header,
        description: firstSlider.description,
        descriptionLinks: firstSlider.descriptionLinks,
        products: firstSliderProducts,
      },
      secondSlider: {
        header: secondSlider.header,
        description: secondSlider.description,
        descriptionLinks: secondSlider.descriptionLinks,
        products: secondSliderProducts,
      },
      thirdSlider: {
        header: thirdSlider.header,
        description: thirdSlider.description,
        descriptionLinks: thirdSlider.descriptionLinks,
        products: thirdSliderProducts,
      },
      forthSlider: {
        header: forthSlider.header,
        description: forthSlider.description,
        descriptionLinks: forthSlider.descriptionLinks,
        products: forthSliderProducts,
      },
      fifthSlider: {
        header: fifthSlider.header,
        description: fifthSlider.description,
        descriptionLinks: fifthSlider.descriptionLinks,
        products: fifthSliderProducts,
      },
      features: processedFeatures,
      metadata: { title: metadataTitle },
      author: authorId || null,
    });

    await newSuggestion.save();

    // Respond with success message
    res.status(201).json({ message: "New Suggestion created successfully!" });
  } catch (error) {
    // Handle errors
    console.error("Error creating Suggestion:", error);
    res.status(500).json({ error: "Error while creating new Suggestion" });
  }
};

exports.fetchAllSuggestions = async (req, res) => {
  try {
    const suggestions = await suggestionDB
      .find({}, "suggestionCardImage mainImage heading shortSummary")
      .populate("mainImage")
      .populate("author")
      .lean()
      .exec();

    if (!suggestions) {
      //console.log(req.query);
      return res.status(404).json({ message: "No suggestions found" });
    }

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.fetchSuggestionByTitle = async (req, res) => {
  try {
    const { heading } = req.query;
    // Find the suggestion by its ID in the database
    const suggestion = await suggestionDB
      .findOne({ heading })
      .populate("mainImage")
      .populate("fiveGrid.fiveGridRooms")
      .populate("twoGrid.twoGridRooms")
      .populate("firstSlider.products")
      .populate("secondSlider.products")
      .populate("thirdSlider.products")
      .populate("forthSlider.products")
      .populate("fifthSlider.products")
      .populate("author");

    // Check if the suggestion exists
    if (!suggestion) {
      // If suggestion is not found, return a 404 Not Found response
      return res.status(404).json({ message: "Suggestion not found" });
    }

    // If suggestion is found, return it in the response
    res.json(suggestion);
  } catch (error) {
    console.error("Error fetching suggestion:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.fetchSuggestionById = async (req, res) => {
  try {
    const suggestionId = req.query.id;

    //console.log(req.query);
    // Find the suggestion by its ID in the database
    const suggestion = await suggestionDB
      .findById(suggestionId)
      .populate("rooms")
      .populate("firstSlider")
      .populate("secondSlider")
      .populate("thirdSlider")
      .populate("features")
      .populate("author");
    // Check if the suggestion exists
    //console.log(suggestion);
    if (!suggestion) {
      // If suggestion is not found, return a 404 Not Found response
      return res.status(404).json({ message: "Suggestion not found" });
    }

    // If suggestion is found, return it in the response
    res.json(suggestion);
  } catch (error) {
    console.error("Error fetching suggestion:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteSuggestionById = async (req, res) => {
  try {
    const suggestionId = req.params.suggestionId;

    const deletedSuggestion = await suggestionDB.findByIdAndDelete(
      suggestionId
    );

    if (!deletedSuggestion) {
      return res.status(404).json({ message: "Suggestion not found" });
    }

    res.json({ message: "Suggestion deleted successfully" });
  } catch (error) {
    // Handle errors
    console.error("Error deleting suggestion:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateSuggestionFeatures = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { features } = req.body;

    if (!features || !Array.isArray(features)) {
      return res.status(400).json({ message: "Invalid features data" });
    }

    // Process and validate features
    const processedFeatures = features.map((feature) => ({
      name: feature.name,
      description: feature.description,
      displayType: feature.displayType || "tips",
      icon: feature.icon || null,
    }));

    const updatedSuggestion = await suggestionDB.findByIdAndUpdate(
      suggestionId,
      { $set: { features: processedFeatures } },
      { new: true }
    );

    if (!updatedSuggestion) {
      return res.status(404).json({ message: "Suggestion not found" });
    }

    res.json({
      message: "Features updated successfully",
      features: updatedSuggestion.features,
    });
  } catch (error) {
    console.error("Error updating suggestion features:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
