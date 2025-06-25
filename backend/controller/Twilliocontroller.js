const twilio = require('twilio');
const User = require('../models/user'); // Make sure this path is correct
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

// Send OTP if user with given email exists
module.exports.sendOTP = async (req, res) => {
  const { email, phoneNumber } = req.body;

  if (!email || !phoneNumber) {
    return res.status(400).json({ message: "Email and phone number are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    const response = await client.verify.v2.services(verifySid)
      .verifications.create({ to: phoneNumber, channel: 'sms' });

    res.status(200).json({ message: "OTP sent", status: response.status });
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

// Verify OTP and update only the phone number field
module.exports.verifyOTP = async (req, res) => {
  const { email, phoneNumber, code } = req.body;

  if (!email || !phoneNumber || !code) {
    return res.status(400).json({ message: "Email, phone number, and OTP code are required" });
  }

  try {
    const verification = await client.verify.v2.services(verifySid)
      .verificationChecks.create({ to: phoneNumber, code });

    if (verification.status === 'approved') {
      const user = await User.findOneAndUpdate(
        { email },
        { $set: { phoneNumber } }, // update only phone number
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ message: "OTP verified. Phone number updated.", verified: true });
    } else {
      res.status(400).json({ message: "Invalid OTP", verified: false });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error.message);
    res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};
