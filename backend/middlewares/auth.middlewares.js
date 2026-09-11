const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user");
const logger = require('../utils/logger');
const { ERRORS } = require('../config/errors');

const verifyToken = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    // Strip one or two "Bearer " prefixes
    token = authHeader.replace(/^Bearer\s+/i, '').replace(/^Bearer\s+/i, '');
  } else {
    token = req.cookies.refreshToken;
  }

  if (!token) {
    const e = ERRORS.AUTH.NO_TOKEN;
    return res.status(e.status).json({ success: false, code: e.code, message: e.message });
  }

  const secret = authHeader ? process.env.ACCESS_TOKEN_SECRET : process.env.REFRESH_TOKEN_SECRET;

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    const e = ERRORS.AUTH.TOKEN_INVALID;
    return res.status(e.status).json({ success: false, code: e.code, message: e.message });
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    const e = ERRORS.AUTH.USER_NOT_FOUND;
    return res.status(e.status).json({ success: false, code: e.code, message: e.message });
  }

  // Attach user without sensitive fields so no controller can accidentally leak them
  req.user = user.toObject();
  delete req.user.password;
  delete req.user.refreshTokens;

  logger.debug('[verifyToken] authenticated', { userId: req.user._id });
  next();
});

module.exports = verifyToken;

