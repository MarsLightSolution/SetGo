const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'AZN',
    },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'card',
    },
    description: String,
    email: String,
    
    // Azericard specific fields
    transactionId: String,
    rrn: String,
    responseCode: String,
    responseMessage: String,
    
    // Metadata
    metadata: {
      type: Map,
      of: String,
    },
    
    // IP and user agent for fraud detection
    ipAddress: String,
    userAgent: String,
    
    // Refund information
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundedAt: Date,
    refundReason: String,
    
    // Timestamps
    authorizedAt: Date,
    capturedAt: Date,
    failedAt: Date,
    
    // Error tracking
    errorCode: String,
    errorMessage: String,
    
    // Webhook received
    webhookReceived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);