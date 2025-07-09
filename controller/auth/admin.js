const Admin = require("../../model/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//when creating a new admin only username and password is passed then in profile what are we retriving

exports.createAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin)
      return res.status(400).json({ message: "Username already exists" });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new admin
    const admin = new Admin({ username, password: hashedPassword });
    await admin.save();

    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ message: "Admin not found" });

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword)
      return res.status(400).json({ message: "Invalid username or password" });

    // Create and assign a token
    const token = jwt.sign({ _id: admin._id }, process.env.ADMIN_SECRET_KEY);
    res.header("Authorization", token).json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminProfile = async (req, res) => {
  const adminId = req.user._id;
  try {
    const adminInfo = await Admin.findOne({ _id: adminId });
    res.status(200).json(adminInfo);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.getAllAdmin = async (req, res) => {
  try {
    const adminInfo = await Admin.find().select("-password");
    res.status(200).json(adminInfo);
  } catch (error) {
    res.status(500).send(error);
  }
};
