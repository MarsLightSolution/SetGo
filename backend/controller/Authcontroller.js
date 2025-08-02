// controllers/authController.js

const TempUser = require("../models/tempuser");
const User = require("../models/user");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redisClient = require("../utils/redisClient");
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
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: "Username can only contain alphanumeric characters and underscores" });
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
    const token          = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(password, 10);

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

    const verificationLink = `http://localhost:8080/verifyemail?token=${token}`;

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

    // Ensure permanent user doesn't already exist
    if (await User.exists({ email: tempUser.email })) {
      await TempUser.deleteOne({ token });
      return res.status(400).send("User already verified. Please login.");
    }

    // Create permanent user
    const user = await User.create({
      email: tempUser.email,
      username: tempUser.username,
      password: tempUser.password,
      role: "user",
    });

    // Clean up temp user
    await TempUser.deleteOne({ token });

    logger.info(`[VerifyEmail] User verified: ${user.email}`);
    return res.status(200).send(`
      <html>
        <head><title>Email Verified</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #4CAF50;">✅ Email Verified Successfully!</h1>
          <p>Your account has been created. You can now <a href="http://localhost:5173/login" style="color: #4CAF50;">login</a> to your account.</p>
        </body>
      </html>
    `);
  } catch (err) {
    logger.error(`[VerifyEmail] Error: ${err.stack}`);
    return res.status(500).send("Server error during verification.");
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
 * LOGIN WITH COOKIE-BASED AUTHENTICATION
 *******************************************************************/
module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "The email address you entered is incorrect." });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`[Login] Incorrect password for ${email}`);
      return res.status(400).json({ message: "The password you entered is incorrect." });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set HttpOnly cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set user data in cookies for frontend access
    res.cookie("userData", JSON.stringify({
      userId: user._id,
      userName: user.username,
      email: user.email,
      role: user.role
    }), {
      httpOnly: false, // Allow frontend access
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info(`[Login] User logged in: ${email}`);

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        userId: user._id,
        userName: user.username,
        email: user.email,
        role: user.role,
      }
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
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "Refresh token not found" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      logger.warn(`[RefreshToken] Invalid refresh token for user id ${decoded.id}`);
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user);
    
    // Update access token cookie
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    logger.info(`[RefreshToken] Access token refreshed for user id ${decoded.id}`);

    return res.json({ success: true, message: "Token refreshed successfully" });
  } catch (err) {
    logger.error(`[RefreshToken] Error: ${err.stack}`);
    return res.status(403).json({ message: "Refresh token expired or invalid" });
  }
};

/********************************************************************
 * JWT PROTECTION MIDDLEWARE (uses cookies)
 *******************************************************************/
module.exports.verifyJWT = (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    return res.status(401).json({ message: "Access token missing" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    logger.info(`[verifyJWT] Valid token for user id: ${decoded.id}`);
    next();
  } catch (err) {
    logger.error(`[verifyJWT] Token verification failed: ${err.message}`);
    return res.status(401).json({ message: "Invalid access token" });
  }
};

/********************************************************************
 * LOGOUT ENDPOINT
 *******************************************************************/
module.exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Remove refresh token from user
      await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } }
      );
    }

    // Clear all auth cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.clearCookie("userData");

    logger.info(`[Logout] User logged out successfully`);
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    logger.error(`[Logout] Error: ${err.stack}`);
    return res.status(500).json({ message: "Error during logout" });
  }
};

/********************************************************************
 * FORGOT PASSWORD
 *******************************************************************/
module.exports.forgetpassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `http://localhost:8080/verifytoken?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    logger.info(`[ForgotPassword] Reset email sent to ${email}`);
    return res.json({ message: "Password reset email sent" });
  } catch (err) {
    logger.error(`[ForgotPassword] Error: ${err.stack}`);
    return res.status(500).json({ error: "Server error" });
  }
};

/********************************************************************
 * VERIFY RESET TOKEN
 *******************************************************************/
module.exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Token is required" });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    return res.json({ success: true, message: "Token is valid" });
  } catch (err) {
    logger.error(`[VerifyResetToken] Error: ${err.stack}`);
    return res.status(500).json({ error: "Server error" });
  }
};

/********************************************************************
 * RESET PASSWORD
 *******************************************************************/
module.exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: "Token and new password are required" });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`[ResetPassword] Password reset for user ${user.email}`);
    return res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    logger.error(`[ResetPassword] Error: ${err.stack}`);
    return res.status(500).json({ error: "Server error" });
  }
};
