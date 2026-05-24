// controllers/authController.js

const TempUser = require("../models/tempuser");
const User = require("../models/user");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
require("dotenv").config();

/********************************************************************
 * SIGN‑UP (TEMP USER + EMAIL VERIFICATION)
 *******************************************************************/
module.exports.signup = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // --- Validation ------------------------------------------------
    if (!email || !username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return res.status(400).json({ error: "Username can only contain alphanumeric characters" });
    }
    if (username.length < 3 || username.length > 16) {
      return res.status(400).json({ error: "Username must be between 3 and 16 characters long" });
    }

    // --- Existing user checks -------------------------------------
    if (await User.exists({ username })) {
      return res.status(400).json({ error: "Username is already taken" });
    }
    if (await User.exists({ email })) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // --- Create temp user -----------------------------------------
    const token = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(password, 10);

    const temp_user = await TempUser.findOne({ email });
    if (temp_user) {
      await TempUser.deleteOne({ _id: temp_user._id });
    }
    await TempUser.create({ email, username, password: hashedPassword, token });
    logger.info(`[Signup] Temp user created: ${username}`);

    // --- Send mail -------------------------------------------------
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const verificationLink = `${process.env.SERVER_BACKEND}/verifyemail?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification - Action Required",
      html: `
        <h2 style="color:#4CAF50;">Hi ${username},</h2>
        <p>Thank you for signing up! Please verify your email by clicking the button below. This link is valid for <strong>15 minutes</strong>.</p>
        <p style="text-align:center;margin:30px 0;">
          <a href="${verificationLink}" style="background:#4CAF50;color:#fff;padding:12px 20px;text-decoration:none;border-radius:5px;">Verify My Email</a>
        </p>
        <p>If the button does not work, copy and paste this URL into your browser:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
      `,
    });

    logger.info(`[Signup] Verification email sent to ${email}`);
    return res.status(201).json({ message: "Signup successful. Please check your email to verify your account." });
  } catch (err) {
    logger.error(`[Signup] Error: ${err.stack}`);
    return res.status(500).json({ error: "Server error" });
  }
};

/********************************************************************
 * EMAIL‑VERIFICATION CALLBACK
 *******************************************************************/
module.exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    logger.info(`[VerifyEmail] Token received: ${token}`);
    if (!token) return res.status(400).send("Verification token is required.");

    const tempUser = await TempUser.findOne({ token });
    if (!tempUser) return res.status(400).send("Invalid or expired verification token.");

    // Ensure permanent user doesn’t already exist
    if (await User.exists({ $or: [{ email: tempUser.email }, { username: tempUser.username }] })) {
      await TempUser.deleteOne({ _id: tempUser._id });
      logger.warn(`[VerifyEmail] Duplicate user attempted for token ${token}`);
      return res.status(409).send("User already exists in permanent database.");
    }

    await User.create({
      email: tempUser.email,
      username: tempUser.username,
      password: tempUser.password,
      emailVerified: true,
    });
    await TempUser.deleteOne({ _id: tempUser._id });

    logger.info(`[VerifyEmail] Email verified for: ${tempUser.email}`);
    return res.redirect(`${process.env.SERVER_FRONTEND}/confirm?verified=true&email=${encodeURIComponent(tempUser.email)}`);
  } catch (err) {
    logger.error(`[VerifyEmail] Error: ${err.stack}`);
    return res.status(500).send("An error occurred during email verification.");
  }
};

/********************************************************************
 * ACCESS / REFRESH TOKEN HELPERS
 *******************************************************************/
const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, fullName: user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id, fullName: user.username }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

/********************************************************************
 * LOGIN WITH REDIS‑ASSISTED LOOKUP
 *******************************************************************/
module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Fetch user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "The email address you entered is incorrect." });
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`[Login] Incorrect password for ${email}`);
      return res.status(400).json({ message: "The password you entered is incorrect." });
    }

    // 3. Generate tokens
    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 4. Add refresh token for this device (keeps other devices active)
    user.refreshTokens = [...(user.refreshTokens || []), refreshToken];
    await user.save({ validateBeforeSave: false });

    // 5. Set HttpOnly cookie (web) — mobile reads token from response body
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info(`[Login] User logged in: ${email}`);

    return res.json({
      success: true,
      accessToken: "Bearer " + accessToken,
      refreshToken,
      userId: user._id,
      userName: user.username,
      role: user.role,
    });

  } catch (err) {
    logger.error(`[Login] Error: ${err.stack}`);
    return res.status(500).json({ message: "Internal server error." });
  }
};


/********************************************************************
 * REFRESH‑ACCESS‑TOKEN ENDPOINT
 *******************************************************************/
module.exports.refreshAccessToken = async (req, res) => {
  // Accept from cookie (web) or body (React Native — can't read HttpOnly cookies)
  const token = req.cookies.refreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ message: "Refresh token not found" });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens?.includes(token)) {
      logger.warn(`[RefreshToken] Invalid refresh token for user id ${decoded.id}`);
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Rotate: remove old token, issue new one for this device
    user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    const newAccessToken  = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info(`[RefreshToken] Access token refreshed for user id ${decoded.id}`);

    return res.json({ success: true, accessToken: "Bearer " + newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    logger.error(`[RefreshToken] Error: ${err.stack}`);
    return res.status(403).json({ message: "Refresh token expired or invalid" });
  }
};

/********************************************************************
 * LOGOUT (invalidate refresh token + clear cache)
 *******************************************************************/
module.exports.logout = async (req, res) => {
  try {
    // Accept token from cookie (web) or body (mobile — can't use HttpOnly cookies)
    const token = req.cookies.refreshToken || req.body?.refreshToken;
    if (!token) return res.status(200).json({ message: "Logged out successfully" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      res.clearCookie("refreshToken");
      return res.status(200).json({ message: "Logged out successfully" });
    }

    const user = await User.findById(decoded.id);
    if (user) {
      // Only revoke this device's token, leave other devices active
      user.refreshTokens = (user.refreshTokens || []).filter(t => t !== token);
      await user.save({ validateBeforeSave: false });
    }

    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    logger.error(`[Logout] Error: ${err.stack}`);
    return res.status(500).json({ message: "Failed to logout" });
  }
};

/********************************************************************
 * FORGOT‑PASSWORD (send reset link)
 *******************************************************************/
module.exports.forgetpassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found or email not verified" });

    user.resetToken = crypto.randomBytes(32).toString("hex");
    user.resetTokenExpiration = Date.now() + 3600000; // 1 h
    await user.save({ validateBeforeSave: false });
    logger.info(`[ForgetPassword] Reset token created for: ${email}`);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const resetLink = `${process.env.SERVER_BACKEND}/verifytoken?token=${user.resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.username},</p>
        <p>Click the button below to reset your password (valid for 1 hour):</p>
        <p style="text-align:center;margin:30px 0;">
          <a href="${resetLink}" style="background:#4CAF50;color:#fff;padding:12px 20px;text-decoration:none;border-radius:5px;">Reset Password</a>
        </p>
        <p>If that doesn't work, copy and paste this URL into your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
      `,
    });

    logger.info(`[ForgetPassword] Reset email sent to: ${email}`);
    return res.status(200).json({ message: "Password reset link sent to your email." });
  } catch (err) {
    logger.error(`[ForgetPassword] Error: ${err.stack}`);
    return res.status(500).json({ error: "Something went wrong. Please try again later." });
  }
};

/********************************************************************
 * VERIFY RESET TOKEN (redirect to front‑end form)
 *******************************************************************/
module.exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Token is required" });

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    logger.info(`[VerifyResetToken] Valid reset token for: ${user.email}`);
    return res.redirect(`${process.env.SERVER_FRONTEND}/newpassword?token=${token}`);
  } catch (err) {
    logger.error(`[VerifyResetToken] Error: ${err.stack}`);
    return res.status(500).json({ error: "Server error during token verification" });
  }
};

/********************************************************************
 * RESET PASSWORD
 *******************************************************************/
module.exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { newPassword } = req.body;

    if (!token || !newPassword) return res.status(400).json({ error: "Token and new password are required" });

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    logger.info(`[ResetPassword] Password reset for: ${user.email}`);
    return res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    logger.error(`[ResetPassword] Error: ${err.stack}`);
    return res.status(500).json({ error: "Something went wrong. Please try again later." });
  }

};
module.exports.checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.json({
      success: true,
      email: user.email,
      emailVerified: user.emailVerified,
    });
  } catch (err) {
    logger.error(`[CheckVerification] Error: ${err.stack}`);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
