const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  profileName: {
    type: String,
    required: false,
    trim: true
  },
  deliveryAddress: {
    type: String,
    required: false
  },
  billingAddress: {
    type: String,
    required: false  },
  phoneNumber: {
    type: String,
    required: false,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: true
  },
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
    subscribed: {
      type: Boolean,
      default: false
    },
    subscribedAt: Date
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
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
