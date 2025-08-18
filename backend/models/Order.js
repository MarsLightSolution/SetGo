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
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"], // ✅ Added cancelled
      default: "pending", // usually starts as pending before payment
    },
    trackingId: {
      type: String,
      default: null, // only set when seller provides tracking
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
