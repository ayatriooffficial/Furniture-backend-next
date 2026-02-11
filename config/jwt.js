const jwt = require("jsonwebtoken");

// JWT setup
const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      id: user.googleId,
      displayName: user.displayName,
      email: user.email,
    },
    process.env.SECRET_KEY,
    { expiresIn: "7d" },
  );
};

module.exports = generateToken;
