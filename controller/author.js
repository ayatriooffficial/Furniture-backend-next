const userDB = require("../model/User");

// exports.createAuthor = async (req, res) => {
//   try {
//     try {
//       const existingUser = await userDB.findOne({ email: req.body.email });
//       if (!existingUser) {
//         return res.status(201).send({ message: "User not found" });
//       }
//       console.log(existingUser);
//       const existingAuthor = await authorDB.findOne({ email: req.body.email });
//       if (existingAuthor) {
//         return res.status(201).send({ message: "Author already exists" });
//       }
//       const author = new authorDB({
//         name: existingUser.displayName,
//         email: req.body.email,
//         image: existingUser.image,
//         description: req.body.description,
//         awards: req.body.awards,
//         rating: req.body.rating,
//         link: req.body.link,
//         experience: req.body.experience,
//         purchase: req.body.purchase,
//         userId: existingUser._id,
//       });

//       // Save Author in the database
//       await author.save();
//       existingUser.authorDetails.isAuthor = true;
//       existingUser.authorDetails.author = author._id;

//       await existingUser.save();
//       res.status(201).send({ message: "Author created successfully" });
//     } catch (error) {
//       console.log(error);
//       res.status(400).json({ message: error.message });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(400).json({ message: error.message });
//   }
// };

exports.getAuthors = async (req, res) => {
  try {
    const authors = await userDB
      .find({ userType: "author" })
      .select("displayName email image authorDetails");
    res.status(200).json(authors);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAuthor = async (req, res) => {
  try {
    const author = await userDB.findById(req.params.id);
    if(!author || author.userType !== "author") {
      return res.status(404).json({ message: "Author not found" });
    }
    res.status(200).json(author);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAuthorByEmail = async (req, res) => {
  try {
    const author = await userDB.findOne({ email: req.params.email });
    if (!author || author.userType !== "author") {
      return res.status(404).json({ message: "Author not found" });
    }
    res.status(200).json(author);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// exports.deleteAuthorByEmail = async (req, res) => {
//   try {
//     const { email } = req.params;
//     const user = await userDB.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     user.authorDetails.isAuthor = false;
//     user.authorDetails.author = null;
//     await user.save();
//     await authorDB.findOneAndDelete({ email });
//     res.status(200).json({ message: "Author deleted successfully" });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.deleteAuthor = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const author = await authorDB.findById(id);
//     if (!author) {
//       return res.status(404).json({ message: "Author not found" });
//     }
//     const user = await userDB.findOne({ email: author.email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     user.authorDetails.isAuthor = false;
//     user.authorDetails.author = null;
//     await user.save();
//     await authorDB.findByIdAndDelete(id);
//     res.status(200).json({ message: "Author deleted successfully" });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.updateAuthor = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const author = await authorDB.findById(id);
//     if (!author) {
//       return res.status(404).json({ message: "Author not found" });
//     }
//     const user = await userDB.findOne({ email: author.email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     if (req.body.name) {
//       user.displayName = req.body.name;
//       author.name = req.body.name;
//     }
//     if (req.body.email) {
//       user.email = req.body.email;
//       author.email = req.body.email;
//     }
//     if (req.body.image) {
//       user.image = req.body.image;
//       author.image = req.body.image;
//     }
//     if (req.body.description) {
//       author.description = req.body.description;
//     }
//     if (req.body.awards) {
//       author.awards = req.body.awards;
//     }
//     if (req.body.rating) {
//       author.rating = req.body.rating;
//     }
//     if (req.body.link) {
//       author.link = req.body.link;
//     }
//     if (req.body.experience) {
//       author.experience = req.body.experience;
//     }
//     if (req.body.purchase) {
//       author.purchase = req.body.purchase;
//     }
//     if (req.body.userId) {
//       author.userId = req.body.userId;
//     }
//     await user.save();
//     await author.save();
//     res.status(200).json({ message: "Author updated successfully" });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };
