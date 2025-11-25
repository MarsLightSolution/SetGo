// models/Order.js
// Updated Order Model for Payment Gateway Pattern

const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // ========= USER REFERENCES =========
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // ========= PAYMENT DETAILS =========
    
    // ⭐ NEW: Payment Microservice Order ID
    paymentOrderId: {
      type: String,
      default: null,
      index: true, // For faster lookups when payment completes
      comment: "Order ID from payment microservice (e.g., ORD1700012345678912)"
    },
    
    // Transaction ID from Azericard (after payment completes)
    transactionId: {
      type: String,
      default: null, // Will be set after successful payment
      comment: "Transaction ID from payment gateway (e.g., TXN123456789)"
    },

    // ⭐ UPDATED: Separate payment status from order status
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
      comment: "Status of payment transaction"
    },

    // ⭐ NEW: Payment breakdown
    total: {
      type: Number,
      required: true,
      comment: "Total order amount (product price)"
    },
    walletDeduction: {
      type: Number,
      default: 0,
      comment: "Amount paid from wallet"
    },
    onlineAmount: {
      type: Number,
      default: 0,
      comment: "Amount paid online via card"
    },
    paidAmount: {
      type: Number,
      default: 0,
      comment: "Total amount actually paid (walletDeduction + onlineAmount)"
    },

    // ⭐ NEW: Payment method tracking
    paymentMethod: {
      type: String,
      enum: ["wallet", "card", "mixed", "pending"],
      default: "pending",
      comment: "How user paid: wallet only, card only, or both"
    },

    // ⭐ NEW: Payment timestamp
    paidAt: {
      type: Date,
      default: null,
      comment: "When payment was completed"
    },

    // ========= ORDER STATUS =========
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled", "released"],
      default: "pending",
      comment: "Order fulfillment status"
    },
    
    trackingId: {
      type: String,
      default: null,
    },

    // ========= CHECKOUT / SHIPPING DETAILS =========
    checkoutDetails: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
    },

    // ========= REVIEW FIELDS =========
    deliveryConfirmedByBuyer: {
      type: Boolean,
      default: false,
    },
    deliveryConfirmedAt: {
      type: Date,
      default: null,
    },
    reviewSubmitted: {
      type: Boolean,
      default: false,
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      default: null,
    },

    // ========= ADDITIONAL TRACKING =========
    
    // ⭐ NEW: For debugging and auditing
    // paymentMetadata: {
    //   type: mongoose.Schema.Mixed,
    //   default: {},
    //   comment: "Additional payment data (optional)"
    // },

    // ⭐ NEW: Cancellation tracking
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
  },
  { 
    timestamps: true,
    // Add indexes for common queries
    indexes: [
      { buyerId: 1, createdAt: -1 }, // Buyer's orders
      { sellerId: 1, createdAt: -1 }, // Seller's orders
      { paymentOrderId: 1 }, // Payment webhook lookup
      { status: 1 }, // Filter by status
      { paymentStatus: 1 } // Filter by payment status
    ]
  }
);

// ========= VIRTUAL FIELDS =========

// Check if payment is complete
orderSchema.virtual('isPaymentComplete').get(function() {
  return this.paymentStatus === 'completed' && this.paidAmount > 0;
});

// Check if order is fully paid
orderSchema.virtual('isFullyPaid').get(function() {
  return this.paidAmount >= this.total;
});

// Get remaining amount (if partially paid)
orderSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.total - this.paidAmount);
});

// ========= INSTANCE METHODS =========

// Mark payment as completed
orderSchema.methods.markPaymentCompleted = function(paymentData) {
  this.paymentStatus = 'completed';
  this.transactionId = paymentData.transactionId;
  this.paidAmount = (this.walletDeduction || 0) + (this.onlineAmount || 0);
  this.paidAt = new Date();
  
  // Update order status to paid if payment is complete
  if (this.isFullyPaid) {
    this.status = 'paid';
  }
  
  return this.save();
};

// Mark payment as failed
orderSchema.methods.markPaymentFailed = function(reason) {
  this.paymentStatus = 'failed';
  this.paymentMetadata = {
    ...this.paymentMetadata,
    failureReason: reason,
    failedAt: new Date()
  };
  
  return this.save();
};

// Cancel order
orderSchema.methods.cancelOrder = function(reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  
  return this.save();
};

// ========= STATIC METHODS =========

// Find order by payment order ID
orderSchema.statics.findByPaymentOrderId = function(paymentOrderId) {
  return this.findOne({ paymentOrderId });
};

// Get buyer's orders
orderSchema.statics.getBuyerOrders = function(buyerId, options = {}) {
  const query = this.find({ buyerId })
    .populate('productId')
    .populate('sellerId', 'name email')
    .sort({ createdAt: -1 });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  return query;
};

// Get seller's orders
orderSchema.statics.getSellerOrders = function(sellerId, options = {}) {
  const query = this.find({ sellerId })
    .populate('productId')
    .populate('buyerId', 'name email')
    .sort({ createdAt: -1 });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  return query;
};

// ========= MIDDLEWARE =========

// Pre-save middleware to calculate payment method
orderSchema.pre('save', function(next) {
  // Determine payment method based on amounts
  if (this.walletDeduction > 0 && this.onlineAmount > 0) {
    this.paymentMethod = 'mixed';
  } else if (this.walletDeduction > 0 && this.onlineAmount === 0) {
    this.paymentMethod = 'wallet';
  } else if (this.onlineAmount > 0 && this.walletDeduction === 0) {
    this.paymentMethod = 'card';
  } else {
    this.paymentMethod = 'pending';
  }
  
  next();
});

// Export model
module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);