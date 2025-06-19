const TempUser = require("../models/tempuser");
const User = require("../models/user");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
module.exports.signup = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return res.status(400).json({ error: "Username can only contain alphanumeric characters" });
    }

    if (username.length < 3 || username.length > 10) {
      return res.status(400).json({ error: "Username must be between 3 and 20 characters long" });
    }

    // Check for existing email or username
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error:"Username is already taken" });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save temp user
    const newUser = new TempUser({
      email,
      username,
      password: hashedPassword,
      token,
    });

    await newUser.save();

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user:process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const verificationLink = `http://localhost:8080/verifyemail?token=${token}`;

   const mailOptions = {
  from: "yourgmail@gmail.com",
  to: email,
  subject: "Email Verification - Action Required",
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="color: #4CAF50;">Hi ${username},</h2>
      <p>Thank you for signing up! To complete your registration, please verify your email address by clicking the button below.</p>
      
      <p><strong>Note:</strong> This verification link is valid for only <strong>15 minutes</strong>. If you do not verify within that time, the registration will expire.</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px;">
          Verify My Email
        </a>
      </p>
      
      <p>If the button above doesn't work, copy and paste the following URL into your browser:</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>

      <p>If you did not request this email, you can safely ignore it.</p>
      <br/>
      <p>Best regards,</p>
      <p><strong>Your Company Team</strong></p>
    </div>
  `,
};
    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "Signup successful. Please check your email to verify your account." });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
module.exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("Verification token is required.");
    }

    const tempUser = await TempUser.findOne({ token });

    if (!tempUser) {
      return res.status(400).send("Invalid or expired verification token.");
    }

    // Create permanent user
    const existingUser = await User.findOne({
      $or: [{ email: tempUser.email }, { username: tempUser.username }],
    });

    if (existingUser) {
      await TempUser.deleteOne({ _id: tempUser._id });
      return res.status(409).send("User already exists in permanent database.");
    }

    const permanentUser = new User({
      email: tempUser.email,
      username: tempUser.username,
      password: tempUser.password,
      emailVerified: true,
    });

    await permanentUser.save();

 
    await TempUser.deleteOne({ _id: tempUser._id });
    res.status(200).send("Email verified successfully. You can now log in.");
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).send("An error occurred during email verification.");
  }
};
module.exports.login = async (req, res) => {
  try {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
   }
   
  }
  catch (error) {
  }

  }


const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, fullName: user.username},
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" } // access token valid for 15 mins
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" } // refresh token valid for 7 days
  );
};

module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "The email address you entered is incorrect." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "The password you entered is incorrect." });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Optionally save refreshToken in DB or Redis
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set refresh token in HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      accessToken:"Bearer " + accessToken,
      userId: user.id,
      userName: user.fullName,
      role: user.role,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
};
module.exports.refreshAccessToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate a new access token
    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      accessToken: "Bearer " + newAccessToken,
    });

  } catch (err) {
    console.error(err);
    return res.status(403).json({ message: "Refresh token expired or invalid" });
  }
};
module.exports.verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    console.error(err);
    return res.status(403).json({ message: "Access token expired or invalid" });
  }
};
module.exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(200).json({ message: "Logged out successfully" }); // No token to clear
    }

    // Optional: Clear refresh token from database
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }

    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    res.status(200).json({ message: "Logged out successfully" });

  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Failed to logout" });
  }
};
module.exports.forgetpassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ error: "User not found or email not verified" });
    }

    // Generate token and set expiration
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Construct reset link
    const resetLink = `http://localhost:8080/resetpassword?token=${resetToken}`;

    // Prepare email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Password Reset Request</h2>
          <p>Hi ${user.username || "User"},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </p>
          <p>If the button above doesn't work, copy and paste this link in your browser:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link is valid for 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset link sent to your email." });

  } catch (error) {
    console.error("Forget password error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again later." });
  }
};
module.exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { newPassword } = req.body;

    // Validation
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Find the user with matching token and check expiration
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;

    // Clear reset token and expiration
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;

    await user.save();

    return res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again later." });
  }
};
