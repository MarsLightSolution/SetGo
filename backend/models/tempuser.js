const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { 
    en: { type: String, required: true, unique: true },
    de: { type: String, required: false } 
  },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 900 }, // 15 minutes TTL
});

module.exports = mongoose.model("TempUser", tempUserSchema);
