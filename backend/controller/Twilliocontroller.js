// controllers/otpController.js
const twilio = require('twilio');
require('dotenv').config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);
module.exports.sendOTP = async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ message: "Phone number is required" });

  try {
    const response = await client.verify.v2.services(verifySid)
      .verifications.create({ to: phoneNumber, channel: 'sms' });

    res.status(200).json({ message: "OTP sent", status: response.status });
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

module.exports.verifyOTP = async (req, res) => {
  const { phoneNumber, code } = req.body;
  if (!phoneNumber || !code) return res.status(400).json({ message: "Phone number and code are required" });

  try {
    const response = await client.verify.v2.services(verifySid)
      .verificationChecks.create({ to: phoneNumber, code });

    if (response.status === 'approved') {
      res.status(200).json({ message: "OTP verified", verified: true });
    } else {
      res.status(400).json({ message: "Invalid OTP", verified: false });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error.message);
    res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};
