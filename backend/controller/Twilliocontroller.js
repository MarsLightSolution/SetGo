const twilio = require('twilio');
const User = require('../models/user');
const logger = require('../utils/logger');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

// ✅ Send OTP if user exists
module.exports.sendOTP = async (req, res) => {
  const { email, phoneNumber } = req.body;

  logger.info(`[SendOTP] Request`, { email, phoneNumber });

  if (!email || !phoneNumber) {
    logger.warn(`[SendOTP] Missing email or phoneNumber`);
    return res.status(400).json({ message: "Email and phone number are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`[SendOTP] User not found`, { email });
      return res.status(404).json({ message: "User not found with this email" });
    }

    const response = await client.verify.v2.services(verifySid)
      .verifications.create({ to: phoneNumber, channel: 'sms' });

    logger.info(`[SendOTP] OTP sent`, { email, phoneNumber, status: response.status });
    res.status(200).json({ message: "OTP sent", status: response.status });

  } catch (error) {
    logger.error(`[SendOTP] Twilio error`, { error: error.message });
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

// ✅ Verify OTP and update phone number
module.exports.verifyOTP = async (req, res) => {
  const { email, phoneNumber, code } = req.body;

  logger.info(`[VerifyOTP] Request`, { email, phoneNumber });

  if (!email || !phoneNumber || !code) {
    logger.warn(`[VerifyOTP] Missing email, phoneNumber, or code`);
    return res.status(400).json({ message: "Email, phone number, and OTP code are required" });
  }

  try {
    const verification = await client.verify.v2.services(verifySid)
      .verificationChecks.create({ to: phoneNumber, code });

    logger.info(`[VerifyOTP] Twilio response`, { status: verification.status });

    if (verification.status === 'approved') {
      const user = await User.findOneAndUpdate(
        { email },
        { $set: { phoneNumber } },
        { new: true }
      );

      if (!user) {
        logger.warn(`[VerifyOTP] User not found`, { email });
        return res.status(404).json({ message: "User not found" });
      }

      logger.info(`[VerifyOTP] Phone updated`, { email, phoneNumber });
      res.status(200).json({ message: "OTP verified. Phone number updated.", verified: true });

    } else {
      logger.warn(`[VerifyOTP] Invalid OTP`, { email, phoneNumber });
      res.status(400).json({ message: "Invalid OTP", verified: false });
    }

  } catch (error) {
    logger.error(`[VerifyOTP] Twilio error`, { error: error.message });
    res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};
