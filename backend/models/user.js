const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  profileName: {
    type: String,
    required: false,
    trim: true
  },
  deliveryAddress: {
    type: String,
    required: false,
    default: "NA"
  },
  billingAddress: {
    type: String,
    required: false,
    default: "NA"
  },
  phoneNumber: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  walletBalance: {
    type: Number,
    default: 0
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
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  paymentAccounts: [
    {
      provider: String, // e.g., "PayPal", "Stripe"
      accountId: String,
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  newsletter: {
    type: Boolean,
    default: false,
  },
  messageforuser: {
    type: Boolean,
    default: false,
  },
  refreshToken: {
    type: String, // for JWT refresh token
    required: false,
  },
  resetPasswordToken: {
    type: String, // for password reset token
    required: false,
  },
  resetPasswordExpires: {
    type: Date,
  },
  messagesFromUsers: [
    {
      fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      message: String,
      sentAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  buy: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      purchasedAt: {
        type: Date,
        default: Date.now,
      },
      quantity: Number,
      price: Number,
    },
  ],
  sell: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      listedAt: {
        type: Date,
        default: Date.now,
      },
      quantity: Number,
      price: Number,
      isSold: {
        type: Boolean,
        default: false,
      },
    },
  ],
  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Replace with your actual product model name if different
    }
  ],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // ===== CHAT FUNCTIONALITY FIELDS =====
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  chatDisplayName: {
    type: String,
    default: function () {
      return this.profileName || this.username
    },
  },
  // ===== END CHAT FIELDS =====
}, { timestamps: true })

module.exports = mongoose.models.User || mongoose.model("User", userSchema)
