const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded; // now you can access req.user.id, req.user.fullName
    next();
  } catch (err) {
    console.error("JWT Error:", err);
    return res.status(403).json({ message: "Access token expired or invalid" });
  }
};

module.exports = verifyJWT;
