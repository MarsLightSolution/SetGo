const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    profileName: {
      type: String,
      trim: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
    },
    hasShop: {
      type: Boolean,
      default: false,
    },
    deliveryAddress: {
      type: String,
      default: "NA",
    },
    billingAddress: {
      type: String,
      default: "NA",
    },
    phoneNumber: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "seller"],
      default: "user",
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    transactionHistory: [
      {
        transactionId: String,
        amount: Number,
        direction: { type: String, enum: ["debit", "credit"] },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    activity: [
      {
        action: String,
        date: { type: Date, default: Date.now },
      },
    ],
    paymentAccounts: [
      {
        provider: String,
        accountId: String,
        addedAt: { type: Date, default: Date.now },
      },
    ],
    newsletter: {
      type: Boolean,
      default: false,
    },
    messageforuser: {
      type: Boolean,
      default: false,
    },
    // One entry per active device/session — supports multi-device logout
    refreshTokens: {
      type: [String],
      default: [],
    },
    resetToken: {
      type: String,
    },
    resetTokenExpiration: {
      type: Date,
    },
    messagesFromUsers: [
      {
        fromUserId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: String,
        sentAt: { type: Date, default: Date.now },
      },
    ],
    buy: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        purchasedAt: { type: Date, default: Date.now },
        quantity: Number,
        price: Number,
      },
    ],
    sell: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        listedAt: { type: Date, default: Date.now },
        quantity: Number,
        price: Number,
        isSold: { type: Boolean, default: false },
      },
    ],
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    chatDisplayName: {
      type: String,
      default: function () {
        return this.profileName || this.username;
      },
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pushToken: { type: String, default: null },
    pushPlatform: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
