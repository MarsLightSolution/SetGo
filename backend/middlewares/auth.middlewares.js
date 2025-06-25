const jwt        = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiError     = require("../utils/ApiError.js");
const User         = require("../models/user.model.js");   // your User schema

exports.verifyToken = asyncHandler(async (req, _res, next) => {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication token missing");
  }

  //  extract and verify
  const token   = auth.split(" ")[1];
  let   payload = null;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }

  //fetch the user (optional: select only what you need)
  const user = await User.findById(payload.sub).select("-password");
  if (!user) throw new ApiError(401, "User not found");

  //attach user to request object
  req.user = user;
  next();
});
