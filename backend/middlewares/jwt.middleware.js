const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user"); // Required to check and regenerate access token

const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token missing or invalid" });
  }

  try {
    // Try to verify the access token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    console.warn("Access token expired or invalid, trying to refresh...");

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token. Please login again." });
    }

    try {
      const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const user = await User.findById(decodedRefresh.id);

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(403).json({ message: "Refresh token invalid. Please login again." });
      }

      // Refresh access token
      const newAccessToken = jwt.sign(
        { id: user._id, fullName: user.username },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      // Attach new token to request and response
      req.user = jwt.verify(newAccessToken, process.env.ACCESS_TOKEN_SECRET); // re-verify to populate req.user
      res.setHeader("Authorization", "Bearer " + newAccessToken);

      return next();
    } catch (refreshErr) {
      console.error("Refresh failed:", refreshErr);
      return res.status(403).json({ message: "Refresh token expired or invalid" });
    }
  }
};

module.exports = verifyJWT;
