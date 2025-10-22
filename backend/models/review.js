const mongoose = require("mongoose");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");




const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Review content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  reviewText: {
    type: String,
    maxlength: 1000,
    trim: true,
  },
  
  // Metadata
  isVerifiedPurchase: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
  
  // Engagement
  helpfulCount: {
    type: Number,
    default: 0,
  },
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  // Seller response
  sellerResponse: {
    text: String,
    respondedAt: Date,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to prevent duplicate reviews
reviewSchema.index({ buyerId: 1, orderId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);