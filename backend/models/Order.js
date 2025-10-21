const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
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
    transactionId: {
      type: String,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled", "released"],
      default: "pending",
    },
    trackingId: {
      type: String,
      default: null,
    },

    // ✅ Checkout / Shipping Details
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
    }, // ← Close checkoutDetails here!

    // ========= REVIEW FIELDS (OUTSIDE checkoutDetails) =========
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
    // ========= END REVIEW FIELDS =========
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Order || mongoose.model("Order", orderSchema);