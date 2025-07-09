const jwt = require("jsonwebtoken");

// JWT setup
const generateToken = (user) => {
    return jwt.sign({ id: user.googleId, displayName: user.displayName }, process.env.SECRET_KEY, { expiresIn: '1h' });
};

module.exports = generateToken;


