const jwt = require("jsonwebtoken");

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    
    if (!token) {
      return res.status(403).json({ message: "Token not provided" });
    }

    const decoded = await jwt.verify(
      token.replace("Bearer ", ""),
      process.env.SECRET_KEY
    );

    req.user = decoded;
    console.log("decoded", decoded);
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    if(error.name === 'TokenExpiredError') {
      res.clearCookie('token', {
        httpOnly: true,
      });
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = verifyToken;
