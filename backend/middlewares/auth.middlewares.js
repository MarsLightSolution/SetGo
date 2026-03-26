const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const User = require("../models/user");
const logger = require('../utils/logger');

const verifyToken = asyncHandler(async (req, _res, next) => {
  // Accept Bearer token from Authorization header OR fallback to cookie
  let token;
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    // Strip one or two "Bearer " prefixes (backend returns "Bearer <token>", frontend may add another)
    token = authHeader.replace(/^Bearer\s+/i, '').replace(/^Bearer\s+/i, '');
  } else {
    token = req.cookies.refreshToken;
  }

  logger.debug('token presence check', { hasToken: !!token, source: authHeader ? 'header' : 'cookie' });
  if (!token) {
    throw new ApiError(401, "No token provided");
  }

  // Use ACCESS_TOKEN_SECRET for Bearer tokens (from localStorage), REFRESH_TOKEN_SECRET for cookies
  const secret = authHeader ? process.env.ACCESS_TOKEN_SECRET : process.env.REFRESH_TOKEN_SECRET;

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
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

