const mongoose = require("mongoose");

const concernSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    issueType: {
      type: String,
      enum: [
        "payment_issue",
        "delivery_issue",
        "order_issue",
        "tracking_issue",
        "cancellation_issue",
        "wallet_issue",
        "seller_buyer_issue",
        "ad_report",
        "others"
      ],
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
    },
    walletId: {
      type: String,
      default: null,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    images: [
      {
        type: String,
      }
    ],
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    adminResponses: [
      {
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: {
          type: String,
          required: true,
        },
        respondedAt: {
          type: Date,
          default: Date.now,
        }
      }
    ],
    estimatedResolutionDate: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 48 * 60 * 60 * 1000);
      }
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      userAgent: String,
      ipAddress: String,
      deviceType: String,
    }
  },
  { timestamps: true }
);

concernSchema.index({ userId: 1, status: 1 });
concernSchema.index({ issueType: 1 });
concernSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.Concern || mongoose.model("Concern", concernSchema);
