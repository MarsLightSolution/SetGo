const User = require('../models/user');
const twilio = require('twilio');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

module.exports.nameupdate = async (req, res) => {
  try {
    const userId = req.params.id;
    const { profileName } = req.body;

    logger.info(`[NameUpdate] Request received`, { userId, profileName });

    if (!profileName || typeof profileName !== 'string') {
      logger.warn(`[NameUpdate] Invalid profile name`);
      return res.status(400).json({ message: 'Profile name must be a non-empty string.' });
    }

    const trimmedName = profileName.trim();
    const nameRegex = /^[A-Za-z\s'-]+$/;

    if (trimmedName.length === 0) {
      logger.warn(`[NameUpdate] Name empty after trim`);
      return res.status(400).json({ message: 'Profile name cannot be empty or just spaces.' });
    }

    if (trimmedName.length > 16 || trimmedName.length < 3) {
      logger.warn(`[NameUpdate] Name length out of range`);
      return res.status(400).json({ message: 'Profile name must be 3-16 characters long.' });
    }

    if (!nameRegex.test(trimmedName)) {
      logger.warn(`[NameUpdate] Invalid name format`);
      return res.status(400).json({
        message: 'Profile name must contain only letters, spaces, hyphens (-), or apostrophes (\').'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { username: trimmedName },
      { new: true, runValidators: true }
    );

    if (!user) {
      logger.warn(`[NameUpdate] User not found`, { userId });
      return res.status(404).json({ message: 'User not found.' });
    }

    logger.info(`[NameUpdate] Name updated`, { userId });
    res.status(200).json({ message: 'Profile name updated successfully.', data: user });

  } catch (err) {
    logger.error(`[NameUpdate] Server error`, { error: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports.updateDeliveryAddress = async (req, res) => {
  try {
    const userId = req.params.id;
    const { deliveryAddress } = req.body;

    logger.info(`[UpdateDeliveryAddress] Request`, { userId, deliveryAddress });

    if (!deliveryAddress || typeof deliveryAddress !== 'string') {
      logger.warn(`[UpdateDeliveryAddress] Invalid delivery address`);
      return res.status(400).json({ message: 'Delivery address must be a non-empty string.' });
    }

    const trimmedAddress = deliveryAddress.trim();

    if (trimmedAddress.length === 0) {
      logger.warn(`[UpdateDeliveryAddress] Address empty after trim`);
      return res.status(400).json({ message: 'Delivery address cannot be empty or just spaces.' });
    }

    if (trimmedAddress.length > 300) {
      logger.warn(`[UpdateDeliveryAddress] Address too long`);
      return res.status(400).json({ message: 'Delivery address cannot exceed 300 characters.' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { deliveryAddress: trimmedAddress },
      { new: true, runValidators: true }
    );

    if (!user) {
      logger.warn(`[UpdateDeliveryAddress] User not found`, { userId });
      return res.status(404).json({ message: 'User not found.' });
    }

    logger.info(`[UpdateDeliveryAddress] Updated`, { userId });
    res.status(200).json({ message: 'Delivery address updated successfully.', data: user });

  } catch (err) {
    logger.error(`[UpdateDeliveryAddress] Server error`, { error: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports.verifyOTP = async (req, res) => {
  const { phoneNumber, code, userId } = req.body;

  logger.info(`[VerifyOTP] Request`, { phoneNumber, userId });

  if (!phoneNumber || !code || !userId) {
    logger.warn(`[VerifyOTP] Missing fields`);
    return res.status(400).json({ message: "Phone number, code, and userId are required" });
  }

  try {
    const response = await client.verify.v2.services(verifySid)
      .verificationChecks.create({ to: phoneNumber, code });

    logger.info(`[VerifyOTP] Twilio response`, { status: response.status });

    if (response.status === 'approved') {
      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser && existingUser._id.toString() !== userId) {
        logger.warn(`[VerifyOTP] Phone already in use`, { phoneNumber });
        return res.status(409).json({ message: 'Phone number is already in use' });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { phoneNumber },
        { new: true, runValidators: true }
      );

      if (!user) {
        logger.warn(`[VerifyOTP] User not found`, { userId });
        return res.status(404).json({ message: 'User not found' });
      }

      logger.info(`[VerifyOTP] Phone updated`, { userId });
      return res.status(200).json({ message: "OTP verified and phone number updated", verified: true, data: user });
    } else {
      logger.warn(`[VerifyOTP] Invalid OTP`, { phoneNumber });
      return res.status(400).json({ message: "Invalid OTP", verified: false });
    }
  } catch (error) {
    logger.error(`[VerifyOTP] Twilio error`, { error: error.message });
    return res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};

module.exports.updateBillingAddress = async (req, res) => {
  try {
    const userId = req.params.id;
    const { billingAddress } = req.body;

    logger.info(`[UpdateBillingAddress] Request`, { userId, billingAddress });

    if (!billingAddress || typeof billingAddress !== 'string') {
      logger.warn(`[UpdateBillingAddress] Invalid billing address`);
      return res.status(400).json({ message: 'Billing address must be a non-empty string.' });
    }

    const trimmedAddress = billingAddress.trim();

    if (trimmedAddress.length === 0) {
      logger.warn(`[UpdateBillingAddress] Address empty after trim`);
      return res.status(400).json({ message: 'Billing address cannot be empty or just spaces.' });
    }

    if (trimmedAddress.length > 300) {
      logger.warn(`[UpdateBillingAddress] Address too long`);
      return res.status(400).json({ message: 'Billing address cannot exceed 300 characters.' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { billingAddress: trimmedAddress },
      { new: true, runValidators: true }
    );

    if (!user) {
      logger.warn(`[UpdateBillingAddress] User not found`, { userId });
      return res.status(404).json({ message: 'User not found.' });
    }

    logger.info(`[UpdateBillingAddress] Updated`, { userId });
    res.status(200).json({ message: 'Billing address updated successfully.', data: user });

  } catch (err) {
    logger.error(`[UpdateBillingAddress] Server error`, { error: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports.updatePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;

    logger.info(`[UpdatePassword] Request`, { userId });

    if (!password || typeof password !== 'string') {
      logger.warn(`[UpdatePassword] Invalid password`);
      return res.status(400).json({ message: 'Password must be a non-empty string.' });
    }

    const trimmedPassword = password.trim();

    if (trimmedPassword.length < 6) {
      logger.warn(`[UpdatePassword] Password too short`);
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

    const user = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true, runValidators: true }
    );

    if (!user) {
      logger.warn(`[UpdatePassword] User not found`, { userId });
      return res.status(404).json({ message: 'User not found.' });
    }

    logger.info(`[UpdatePassword] Password updated`, { userId });
    res.status(200).json({ message: 'Password updated successfully.' });

  } catch (err) {
    logger.error(`[UpdatePassword] Server error`, { error: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports.deleteUserAccount = async (req, res) => {
  try {
    const userId = req.params.id;

    logger.info(`[DeleteUserAccount] Request`, { userId });

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      logger.warn(`[DeleteUserAccount] User not found`, { userId });
      return res.status(404).json({ message: 'User not found.' });
    }

    logger.info(`[DeleteUserAccount] Deleted`, { userId });
    res.status(200).json({ message: 'User account deleted successfully.', data: { id: deletedUser._id, email: deletedUser.email } });

  } catch (err) {
    logger.error(`[DeleteUserAccount] Server error`, { error: err.message });
    res.status(500).json({ message: 'Server error while deleting user', error: err.message });
  }
};

module.exports.toggleNewsletterPreference = async (req, res) => {
  try {
    const userId = req.params.id;

    logger.info(`[ToggleNewsletter] Request`, { userId });

    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`[ToggleNewsletter] User not found`, { userId });
      return res.status(404).json({ message: 'User not found.' });
    }

    user.newsletter = !user.newsletter;
    await user.save();

    logger.info(`[ToggleNewsletter] Preference toggled`, { userId, newsletter: user.newsletter });
    res.status(200).json({ message: `Newsletter preference toggled to ${user.newsletter}`, data: user });

  } catch (err) {
    logger.error(`[ToggleNewsletter] Server error`, { error: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports.toggleMessagePreference = async (req, res) => {
  try {
    const userId = req.params.id;

    logger.info(`[ToggleMessagePreference] Request`, { userId });

    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`[ToggleMessagePreference] User not found`, { userId });
      return res.status(404).json({ message: 'User not found.' });
    }

    user.messageforuser = !user.messageforuser;
    await user.save();

    logger.info(`[ToggleMessagePreference] Toggled`, { userId, messageforuser: user.messageforuser });
    res.status(200).json({ message: `Message service preference toggled to ${user.messageforuser}`, data: user });

  } catch (err) {
    logger.error(`[ToggleMessagePreference] Server error`, { error: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    logger.info(`[GetUserProfile] Request`, { userId });

    const user = await User.findById(userId).select('-password -__v');

    if (!user) {
      logger.warn(`[GetUserProfile] User not found`, { userId });
      return res.status(404).json({ message: 'User not found.' });
    }

    logger.info(`[GetUserProfile] Found`, { userId });
    res.status(200).json({ message: 'User profile retrieved successfully.', data: user });

  } catch (err) {
    logger.error(`[GetUserProfile] Server error`, { error: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports.verifyEmail = async (req, res) => {
  const { userId, password, newEmail } = req.body;

  logger.info(`[VerifyEmail] Request`, { userId, newEmail });

  try {
    if (!userId || !password || !newEmail) {
      logger.warn(`[VerifyEmail] Missing fields`);
      return res.status(400).json({ message: 'User ID, password, and new email are required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`[VerifyEmail] User not found`, { userId });
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`[VerifyEmail] Incorrect password`);
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      logger.warn(`[VerifyEmail] Email already in use`, { newEmail });
      return res.status(409).json({ message: 'New email is already in use.' });
    }

    user.email = newEmail;
    await user.save();

    logger.info(`[VerifyEmail] Email updated`, { userId, newEmail });
    res.status(200).json({ message: 'Email updated successfully.', email: user.email });

  } catch (err) {
    logger.error(`[VerifyEmail] Server error`, { error: err.message });
    res.status(500).json({ message: 'Server error.' });
  }
};
