const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const adminController = require("../controller/auth/admin");
const { uploadImage } = require("../middleware/uploadImage");
const verifyAdminToken = require("../middleware/verifyAdminToken");

// create new admin (requires admin token - use for trusted admins only)
router.post("/register", verifyAdminToken, adminController.createAdmin);

// PUBLIC: create new admin without authentication (use for first admin or public signup)
router.post("/register-public", adminController.createAdmin);

// login and get a JWT
router.post("/login", adminController.loginAdmin);

// retrieve admin details
router.get("/profile", verifyAdminToken, adminController.adminProfile);

router.get("/getAdminList", verifyAdminToken, adminController.getAllAdmin);

// POST: '/admin/imgUpload'
//  image upload to S3
router.post(
  "/imgUpload",
  verifyAdminToken,
  uploadImage.array("image", 4),
  (req, res, next) => {
    const imageUrls = req.files.map((file) => file.location);
    res.json({ message: "Images uploaded successfully", imageUrls });
  }
);

module.exports = router;
