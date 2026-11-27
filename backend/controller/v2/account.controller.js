// /api/v2 handlers for user data. New code; the original controllers are unchanged.
// Credentials and session material are never sent; other users see public fields only.
const mongoose = require("mongoose");
const User = require("../../models/user");
const logger = require("../../utils/logger");

const SECRET_FIELDS = "-password -__v -refreshTokens -resetToken -resetTokenExpiration -pushToken -pushPlatform";
const PUBLIC_FIELDS = "username profileName chatDisplayName hasShop shop isOnline lastSeen followers following createdAt";

const canSeePrivate = (req, userId) => String(req.user?._id) === String(userId) || req.user?.role === "admin";

// GET /api/v2/profile/userdata/:id — same response shape as /userdata/:id.
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Invalid user id" });
    const user = await User.findById(userId).select(canSeePrivate(req, userId) ? SECRET_FIELDS : PUBLIC_FIELDS);
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({ message: "User profile retrieved successfully.", data: user });
  } catch (err) {
    logger.error("[v2 GetUserProfile] Server error", { error: err.message });
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/v2/users/get-users — admin only (route guard); never cached, no secrets.
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select(SECRET_FIELDS).lean();
    return res.status(200).json({ data: users });
  } catch (err) {
    logger.error("[v2 GetUsers] DB error", { error: err.message });
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /api/v2/users/get-users/:id — same shape as /users/get-users/:id.
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Invalid user id" });
    const user = await User.findById(userId).select(canSeePrivate(req, userId) ? SECRET_FIELDS : PUBLIC_FIELDS).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ data: user });
  } catch (err) {
    logger.error("[v2 GetUserById] Error", { error: err.message });
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /api/v2/follow/:id/followers and /:id/following — public lists without emails.
const followList = (field) => async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid user ID" });
    const user = await User.findById(id).populate(field, "username profileName");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ [field]: user[field] });
  } catch (err) {
    logger.error(`[v2 ${field}] Error`, { error: err.message });
    return res.status(500).json({ message: `An error occurred while fetching ${field}.` });
  }
};
exports.getFollowers = followList("followers");
exports.getFollowing = followList("following");

// GET /api/v2/auth/check-status?email= — public; returns only the verification flag.
exports.checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }, "emailVerified").lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, emailVerified: !!user.emailVerified });
  } catch (err) {
    logger.error("[v2 CheckVerification] Error", { error: err.message });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/v2/profile/change-password — body { currentPassword, newPassword }.
// Changes the logged-in user's own password after checking the current one, with the same
// rules as signup (8–128 chars, upper + lower case + digit).
const bcrypt = require("bcrypt");
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== "string" || !currentPassword || typeof newPassword !== "string") {
      return res.status(400).json({ success: false, code: "MISSING_FIELDS", message: "Current and new password are required." });
    }
    if (newPassword.length < 8 || newPassword.length > 128 || !PASSWORD_RULE.test(newPassword)) {
      return res.status(400).json({
        success: false,
        code: "WEAK_PASSWORD",
        message: "Password must be 8-128 characters with an uppercase letter, a lowercase letter and a number.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    if (!user.password || !(await bcrypt.compare(currentPassword, user.password))) {
      logger.warn("[v2 changePassword] Wrong current password", { userId: String(user._id) });
      return res.status(400).json({ success: false, code: "WRONG_PASSWORD", message: "Current password is incorrect." });
    }
    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({ success: false, code: "SAME_PASSWORD", message: "New password must be different from the current one." });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    logger.info("[v2 changePassword] Password changed", { userId: String(user._id) });
    return res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    logger.error("[v2 changePassword] Error", { message: err.message });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
