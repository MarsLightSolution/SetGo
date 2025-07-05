const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  profileName: {
    en: { type: String, required: false, trim: true },
    de: { type: String, required: false, trim: true },
  },
  deliveryAddress: {
    en: { type: String, required: false, default: "NA" },
    de: { type: String, required: false, default: "NA" },
  },
  billingAddress: {
    en: { type: String, required: false, default: "NA" },
    de: { type: String, required: false, default: "NA" },
  },
  phoneNumber: {
    en: { type: String, required: false },
    de: { type: String, required: false },
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    en: { type: String, required: true, unique: true },
    de: { type: String, required: true, unique: true },
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: true
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  transactionHistory: [
    {
      transactionId: String,
      type: String,
      amount: Number,
      date: { type: Date, default: Date.now }
    }
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
    default: false
  },
  messageforuser: {
    type: Boolean,
    default: false
  },

  refreshToken: {
    type: String, // for JWT refresh token
    required: false
  },
  resetToken: {
    type: String, // for password reset token
    required: false
  },
  resetTokenExpiration: {
    type: Date
  },
  messagesFromUsers: [
    {
      fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      message: String,
      sentAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  buy: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      purchasedAt: {
        type: Date,
        default: Date.now
      },
      quantity: Number,
      price: Number
    }
  ],

  sell: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      listedAt: {
        type: Date,
        default: Date.now
      },
      quantity: Number,
      price: Number,
      isSold: {
        type: Boolean,
        default: false
      }
    }
  ]
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);
