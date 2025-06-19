const User = require('../models/user'); // Adjust path as needed
const twilio = require('twilio');
require('dotenv').config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

module.exports.nameupdate = async (req, res) => {
    try {
        const userId = req.params.id;
        const { profileName } = req.body;

        // Basic checks
        if (!profileName || typeof profileName !== 'string') {
            return res.status(400).json({ message: 'Profile name must be a non-empty string.' });
        }

        const trimmedName = profileName.trim();

        // Custom validation
        const nameRegex = /^[A-Za-z\s'-]+$/;

        if (trimmedName.length === 0) {
            return res.status(400).json({ message: 'Profile name cannot be empty or just spaces.' });
        }

        if (trimmedName.length > 30) {
            return res.status(400).json({ message: 'Profile name cannot be longer than 30 characters.' });
        }

        if (!nameRegex.test(trimmedName)) {
            return res.status(400).json({
                message: 'Profile name must contain only letters, spaces, hyphens (-), or apostrophes (\'). Numbers or special characters are not allowed.'
            });
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            userId,
            { profileName: trimmedName },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            message: 'Profile name updated successfully.',
            data: user
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports.updateDeliveryAddress = async (req, res) => {
    try {
        const userId = req.params.id;
        const { deliveryAddress } = req.body;

        // Basic validation
        if (!deliveryAddress || typeof deliveryAddress !== 'string') {
            return res.status(400).json({ message: 'Delivery address must be a non-empty string.' });
        }

        const trimmedAddress = deliveryAddress.trim();

        if (trimmedAddress.length === 0) {
            return res.status(400).json({ message: 'Delivery address cannot be empty or just spaces.' });
        }

        if (trimmedAddress.length > 300) {
            return res.status(400).json({ message: 'Delivery address cannot exceed 300 characters.' });
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            userId,
            { deliveryAddress: trimmedAddress },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            message: 'Delivery address updated successfully.',
            data: user
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports.verifyOTP = async (req, res) => {
    const { phoneNumber, code, userId } = req.body;

    if (!phoneNumber || !code || !userId) {
        return res.status(400).json({ message: "Phone number, code, and userId are required" });
    }

    try {
        const response = await client.verify.v2.services(verifySid)
            .verificationChecks.create({ to: phoneNumber, code });

        if (response.status === 'approved') {
            // Check if phone number is already taken
            const existingUser = await User.findOne({ phoneNumber });
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(409).json({ message: 'Phone number is already in use' });
            }

            // Update phone number
            const user = await User.findByIdAndUpdate(
                userId,
                { phoneNumber },
                { new: true, runValidators: true }
            );

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json({
                message: "OTP verified and phone number updated",
                verified: true,
                data: user
            });
        } else {
            return res.status(400).json({ message: "Invalid OTP", verified: false });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error.message);
        return res.status(500).json({ message: "OTP verification failed", error: error.message });
    }
};

module.exports.updateBillingAddress = async (req, res) => {
  try {
    const userId = req.params.id;
    const { billingAddress } = req.body;

    // Basic validation
    if (!billingAddress || typeof billingAddress !== 'string') {
      return res.status(400).json({ message: 'Billing address must be a non-empty string.' });
    }

    const trimmedAddress = billingAddress.trim();

    if (trimmedAddress.length === 0) {
      return res.status(400).json({ message: 'Billing address cannot be empty or just spaces.' });
    }

    if (trimmedAddress.length > 300) {
      return res.status(400).json({ message: 'Billing address cannot exceed 300 characters.' });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { billingAddress: trimmedAddress },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      message: 'Billing address updated successfully.',
      data: user
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports.deleteUserAccount = async (req, res) => {
  try {
    const userId = req.params.id;

    // Optional: Add confirmation check or authentication here

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      message: 'User account deleted successfully.',
      data: {
        id: deletedUser._id,
        email: deletedUser.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error while deleting user', error: err.message });
  }
};

module.exports.toggleNewsletterPreference = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Toggle the value
    user.newsletter = !user.newsletter;
    await user.save();

    res.status(200).json({
      message: `Newsletter preference toggled to ${user.newsletter}`,
      data: user
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports.toggleMessagePreference = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Toggle the value
    user.messageforuser = !user.messageforuser;
    await user.save();

    res.status(200).json({
      message: `Message service preference toggled to ${user.messageforuser}`,
      data: user
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};