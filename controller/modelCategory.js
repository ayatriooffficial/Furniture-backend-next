// const Category = require("../model/ModelCategory");

// // Post request to create or update a category
// exports.createModelCategory = async (req, res) => {
//   try {
//     const { categoryname, images } = req.body;

//     // Ensure categoryname is provided
//     if (!categoryname) {
//       return res.status(400).json({ message: "Category name is required" });
//     }

//     // Check if the category already exists
//     let category = await Category.findOne({ categoryname });

//     if (category) {
//       // If category exists, add only unique images to the images array
//       const existingImages = category.images.map((img) => img.url);
//       const newImages = images.filter(
//         (img) => !existingImages.includes(img.url)
//       );

//       if (newImages.length > 0) {
//         category.images.push(...newImages);
//         await category.save();
//       }

//       return res.status(200).json({
//         message: "Images added to existing category",
//         category,
//       });
//     }

//     // If category doesn't exist, create a new one
//     category = new Category({
//       categoryname,
//       images,
//     });

//     // Save the new category
//     await category.save();

//     res.status(201).json({
//       message: "Category created successfully",
//       category,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Error creating or updating category",
//       error: error.message,
//     });
//   }
// };

// // Get request to retrieve images by category name
// exports.getCategoryImages = async (req, res) => {
//   try {
//     const { categoryname } = req.params;

//     // Find the category by name
//     const category = await Category.findOne({ categoryname });

//     if (!category) {
//       return res.status(404).json({
//         message: "Category not found",
//       });
//     }

//     // Return the images associated with the category
//     res.status(200).json({
//       categoryname: category.categoryname,
//       images: category.images,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Error fetching category images",
//       error: error.message,
//     });
//   }
// };

// const Category = require("../model/ModelCategory");

// // Post request to create or update a category
// exports.createModelCategory = async (req, res) => {
//   try {
//     const { categoryname, rooms, images } = req.body;

//     // Ensure categoryname and rooms are provided
//     if (!categoryname || !rooms) {
//       return res
//         .status(400)
//         .json({ message: "Category name and rooms are required" });
//     }

//     // Check if the category already exists
//     let category = await Category.findOne({ categoryname, rooms });

//     if (category) {
//       // If category exists, add only unique images to the images array
//       const existingImages = category.images.map((img) => img.url);
//       const newImages = images.filter(
//         (img) => !existingImages.includes(img.url)
//       );

//       if (newImages.length > 0) {
//         category.images.push(...newImages);
//         await category.save();
//       }

//       return res.status(200).json({
//         message: "Images added to existing category",
//         category,
//       });
//     }

//     // If category doesn't exist, create a new one
//     category = new Category({
//       categoryname,
//       rooms,
//       images,
//     });

//     // Save the new category
//     await category.save();

//     res.status(201).json({
//       message: "Category created successfully",
//       category,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Error creating or updating category",
//       error: error.message,
//     });
//   }
// };

// exports.getCategoryImages = async (req, res) => {
//   try {
//     const { categoryname, rooms } = req.params;

//     // Find the category by name and rooms
//     const category = await Category.findOne({ categoryname, rooms });

//     if (!category) {
//       return res.status(404).json({
//         message: "Category not found",
//       });
//     }

//     // Return the images associated with the category
//     res.status(200).json({
//       categoryname: category.categoryname,
//       rooms: category.rooms,
//       images: category.images,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Error fetching category images",
//       error: error.message,
//     });
//   }
// };

// const Category = require("../model/ModelCategory");

// // Post request to create or update a category
// exports.createModelCategory = async (req, res) => {
//   try {
//     const { categoryname, rooms } = req.body;

//     // Ensure categoryname and rooms are provided
//     if (!categoryname || !rooms) {
//       return res.status(400).json({ message: "Category name and rooms are required" });
//     }

//     // Check if the category already exists
//     let category = await Category.findOne({ categoryname });

//     if (category) {
//       // Update existing rooms or add new rooms
//       rooms.forEach(newRoom => {
//         let existingRoom = category.rooms.find(room => room.roomName === newRoom.roomName);
//         if (existingRoom) {
//           // Add only unique images to the existing room
//           const existingImages = existingRoom.images.map(img => img.url);
//           const newImages = newRoom.images.filter(img => !existingImages.includes(img.url));

//           if (newImages.length > 0) {
//             existingRoom.images.push(...newImages);
//           }
//         } else {
//           // Add the new room to the category
//           category.rooms.push(newRoom);
//         }
//       });

//       await category.save();

//       return res.status(200).json({
//         message: "Images added/updated in existing category",
//         category,
//       });
//     }

//     // If category doesn't exist, create a new one
//     category = new Category({
//       categoryname,
//       rooms,
//     });

//     // Save the new category
//     await category.save();

//     res.status(201).json({
//       message: "Category created successfully",
//       category,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Error creating or updating category",
//       error: error.message,
//     });
//   }
// };

const Category = require("../model/ModelCategory");

// Post request to create or update a category
exports.createModelCategory = async (req, res) => {
  try {
    const { categoryname, rooms } = req.body;

    // Ensure categoryname and rooms are provided
    if (
      !categoryname ||
      !rooms ||
      !Array.isArray(rooms) ||
      rooms.length === 0
    ) {
      return res
        .status(400)
        .json({
          message:
            "Category name and at least one room (in an array) are required",
        });
    }

    // Check if the category already exists
    let category = await Category.findOne({ categoryname });

    if (category) {
      // Category exists, so update rooms and images
      rooms.forEach((newRoom) => {
        const existingRoom = category.rooms.find(
          (room) => room.roomName === newRoom.roomName
        );

        if (existingRoom) {
          // Add only unique images to the existing room's images array
          const existingImages = existingRoom.images.map((img) => img.url);
          const newImages = newRoom.images.filter(
            (img) => !existingImages.includes(img.url)
          );

          if (newImages.length > 0) {
            existingRoom.images.push(...newImages);
          }
        } else {
          // If the room does not exist, add the entire new room
          category.rooms.push(newRoom);
        }
      });

      await category.save();

      return res.status(200).json({
        message: "Rooms and images updated in the existing category",
        category,
      });
    }

    // If category doesn't exist, create a new one
    category = new Category({
      categoryname,
      rooms, // Rooms should be passed as an array
    });

    // Save the new category
    await category.save();

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating or updating category",
      error: error.message,
    });
  }
};

// Get request to fetch images by category and room name
exports.getCategoryImages = async (req, res) => {
  try {
    const { categoryname, roomName } = req.params;

    // Find the category by name
    const category = await Category.findOne({ categoryname });

    if (!category) {
      return res.status(404).json({
        message: `Category '${categoryname}' not found`,
      });
    }

    // Find the specific room within the category
    const room = category.rooms.find((r) => r.roomName === roomName);

    if (!room) {
      return res.status(404).json({
        message: `Room '${roomName}' not found in category '${categoryname}'`,
      });
    }

    // Return the images associated with the room
    res.status(200).json({
      categoryname: category.categoryname,
      roomName: room.roomName,
      images: room.images,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching category images",
      error: error.message,
    });
  }
};
