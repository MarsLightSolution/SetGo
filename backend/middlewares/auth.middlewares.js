const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const User = require("../models/user");

const verifyToken = asyncHandler(async (req, _res, next) => {
  const token = req.cookies.refreshToken; // ✅ Get token from cookies
  console.log(token);
  if (!token) {
    throw new ApiError(401, "No token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  req.user = user;
  next();
});

module.exports = verifyToken;

