const passport = require("passport");
const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const generateToken = require("../config/jwt");
const userDB = require("../model/User");
const { sendEmailToUser } = require("../controller/sendmail");
const { uploadImage } = require("../middleware/uploadImage");

const baseURL =
  process.env.NODE_ENV === "production"
    ? "https://www.ayatrio.com"
    : "http://localhost:3000";

// Google OAuth login
router.get("/google", (req, res, next) => {
  const { returnTo } = req.query;
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: returnTo, // Pass returnTo URL as OAuth state parameter
  })(req, res, next);
});

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${baseURL}/login`,
  }),
  async (req, res) => {
    try {
      const { email, _id } = req.user;
      const path = req.query.state || `profile/${_id}`;
      const token = generateToken(req.user);
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
        domain: ".ayatrio.com",
      });
      console.log("path");
      const redirectUrl = `${baseURL}/${path}?token=${token}`;
      res.redirect(redirectUrl);
      await sendEmailToUser(email);
    } catch (error) {
      console.error("Error processing Google OAuth callback:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Check user authentication status
router.get("/user", verifyToken, async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const userInfo = await userDB.find({ googleId: req.user.id });
      if (userInfo.length > 0) {
        const userObject = userInfo[0];
        res.json({ isAuthenticated: true, user: userObject });
      } else {
        res.json({ isAuthenticated: false, user: null });
      }
    } else {
      res.json({ isAuthenticated: false, user: null });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
});

// Update user profile
router.put("/update-profile", verifyToken, async (req, res) => {
  try {
    const googleId = req.user.id;
    const { displayName, email, photoURL } = req.body;

    const updatedUser = await userDB.findOneAndUpdate(
      { googleId },
      { displayName, email, photoURL },
      { new: true }
    );

    res.json({ message: "Profile updated successfully", user: updatedUser });
    console.log("Profile updated successfully", updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete user profile
router.delete("/delete-profile", verifyToken, async (req, res) => {
  try {
    const googleId = req.user.id;

    await userDB.findOneAndDelete({ googleId });
    res.json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userDB.findById(id);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Logout route
router.get("/logout", (req, res, next) => {
  console.log("Logging out...");
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect(`${baseURL}/`);
  });
});

router.put(
  "/update-user/:id",
  uploadImage.fields([{ name: "image", maxCount: 1 }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log(req.body);
      const user = await userDB.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update the displayName if provided
      user.displayName = req.body.displayName || user.displayName;
      
      // Update image if provided
      if (req.files && req.files.image) {
        user.image = req.files.image[0].location;
      }
      
      // Update role
      user.role = req.body.role;
      
      // Update authorDetails fields if they exist
      user.authorDetails = user.authorDetails || {};
      if (req.body.authorDetails) {
        user.authorDetails.description = req.body.authorDetails.description;
        user.authorDetails.experience = req.body.authorDetails.experience;
        user.authorDetails.award = req.body.authorDetails.award;
      }
      
      // Update links
      user.links = { ...req.body.links };
      
      await user.save();
      console.log({ user });

      res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post("/create-user", async (req, res) => {
  try {
    const { displayName, email, phone } = req.body;
    console.log(req.body);
    console.log(email);
    if (!displayName || !email || !phone) {
      console.log("Name, phone, email  are required");
      return res.status(400).json({ message: "Name and email are required" });
    }
    if (email) {
      const existingUser = await userDB.findOne({ email });
      if (existingUser) {
        console.log("User already exists with this email");
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }
    }

    if (phone) {
      console.log(phone);
      const existingUser = await userDB.findOne({ phone });
      console.log(existingUser);
      if (existingUser) {
        console.log("User already exists with this phone");
        return res
          .status(400)
          .json({ message: "User already exists with this phone" });
      }
    }

    console.log("Creating user");

    const user = new userDB({ displayName, email, phone });
    await user.save();
    // await sendEmailToUser(email);
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
