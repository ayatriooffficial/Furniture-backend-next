const jwt = require("jsonwebtoken");

// ✅ REQUIRED AUTH - Strictly require login token
// Use for: /checkout, /profile, /order, protected actions
const requireAuth = async (req, res, next) => {
  try {
    // Check 3 sources: Authorization header, JWT cookie, query param
    const token =
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.cookies.jwt ||
      req.query.token;

    if (!token) {
      return res.status(401).json({
        message: "Login required",
        error: "No token provided",
      });
    }

    const decoded = await jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    console.log("✅ [requireAuth] User authenticated:", decoded._id);
    next();
  } catch (error) {
    console.error("❌ [requireAuth] Token verification failed:", error.message);

    if (error.name === "TokenExpiredError") {
      res.clearCookie("jwt", { httpOnly: true });
      return res
        .status(401)
        .json({ message: "Token expired. Please login again." });
    }

    return res.status(401).json({ message: "Authentication failed" });
  }
};

// ✅ OPTIONAL AUTH - Allow guest OR logged-in
// Use for: /cart, /products, /wishlist, /recommendations
const optionalAuth = async (req, res, next) => {
  try {
    // Check 3 sources but DON'T reject if missing
    const token =
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.cookies.jwt ||
      req.query.token;

    if (token) {
      try {
        const decoded = await jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        req.isAuthenticated = true;
        console.log("✅ [optionalAuth] User authenticated:", decoded._id);
      } catch (error) {
        console.warn(
          "⚠️ [optionalAuth] Token invalid, treating as guest:",
          error.message,
        );
        req.user = null;
        req.isAuthenticated = false;
      }
    } else {
      req.user = null;
      req.isAuthenticated = false;
      console.log("ℹ️ [optionalAuth] Guest access allowed");
    }

    next(); // ALWAYS allow, guest or logged-in
  } catch (error) {
    console.error("❌ [optionalAuth] Unexpected error:", error.message);
    // If something really goes wrong, still allow through as guest
    req.user = null;
    req.isAuthenticated = false;
    next();
  }
};

// ✅ BACKWARD COMPATIBILITY - Old name still works
const verifyToken = requireAuth;

module.exports = {
  requireAuth, // Use for protected routes (login required)
  optionalAuth, // Use for public/guest routes (auth optional)
  verifyToken, // Legacy export for backward compatibility
};
