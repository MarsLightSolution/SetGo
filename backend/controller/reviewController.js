
const Order = require("../models/Order");
const Product = require("../models/product.model");
const User = require("../models/user");
const Review = require("../models/review"); // ⚠️ CREATE THIS MODEL (schema provided below)



const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/review-error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/review-combined.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});


// ============================================
// HELPER FUNCTION: Update Product Ratings
// ============================================
const updateProductRatings = async (productId) => {
  try {
    const reviews = await Review.find({
      productId,
      status: "approved",
    });

    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: 0,
        totalReviews: 0,
        "ratingDistribution.oneStar": 0,
        "ratingDistribution.twoStar": 0,
        "ratingDistribution.threeStar": 0,
        "ratingDistribution.fourStar": 0,
        "ratingDistribution.fiveStar": 0,
      });
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = parseFloat((totalRating / reviews.length).toFixed(1));

    // Calculate distribution
    const distribution = {
      oneStar: reviews.filter((r) => r.rating === 1).length,
      twoStar: reviews.filter((r) => r.rating === 2).length,
      threeStar: reviews.filter((r) => r.rating === 3).length,
      fourStar: reviews.filter((r) => r.rating === 4).length,
      fiveStar: reviews.filter((r) => r.rating === 5).length,
    };

    // Update product
    await Product.findByIdAndUpdate(productId, {
      averageRating,
      totalReviews: reviews.length,
      "ratingDistribution.oneStar": distribution.oneStar,
      "ratingDistribution.twoStar": distribution.twoStar,
      "ratingDistribution.threeStar": distribution.threeStar,
      "ratingDistribution.fourStar": distribution.fourStar,
      "ratingDistribution.fiveStar": distribution.fiveStar,
    });

    logger.info(
      `Updated ratings for product ${productId}: ${averageRating} (${reviews.length} reviews)`
    );
  } catch (error) {
    logger.error("Error updating product ratings:", error.message);
    throw error;
  }
};

// ============================================
// 1. CONFIRM DELIVERY (Buyer manually confirms)
// ============================================
exports.confirmDelivery = async (req, res) => {
  const endpoint = "confirmDelivery";
  const startTime = Date.now();

  try {
    const { orderId } = req.params;
    const { buyerId } = req.body; // Pass buyerId in body for now (no auth)

    if (!buyerId) {
      logger.warn(`${endpoint}: Missing buyerId`, { orderId });
      return res.status(400).json({
        success: false,
        message: "Buyer ID is required",
      });
    }

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      logger.warn(`${endpoint}: Order not found`, { orderId });
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify buyer
    if (order.buyerId.toString() !== buyerId.toString()) {
      logger.warn(`${endpoint}: Unauthorized buyer`, { orderId, buyerId });
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You are not the buyer of this order.",
      });
    }

    // Check if already confirmed
    if (order.deliveryConfirmedByBuyer) {
      logger.warn(`${endpoint}: Delivery already confirmed`, { orderId });
      return res.status(400).json({
        success: false,
        message: "Delivery already confirmed",
        data: {
          confirmedAt: order.deliveryConfirmedAt,
          needsReview: !order.reviewSubmitted,
        },
      });
    }

    // Check order status
    if (order.status !== "delivered" && order.status !== "paid") {
      logger.warn(`${endpoint}: Invalid order status`, {
        orderId,
        status: order.status,
      });
      return res.status(400).json({
        success: false,
        message: `Cannot confirm delivery. Order status is: ${order.status}`,
      });
    }

    // Update order
    order.status = "delivered";
    order.deliveryConfirmedByBuyer = true;
    order.deliveryConfirmedAt = new Date();
    await order.save();

    logger.info(`${endpoint}: Delivery confirmed successfully`, {
      orderId,
      buyerId,
      duration: Date.now() - startTime + "ms",
    });

    res.json({
      success: true,
      message: "Delivery confirmed successfully! You can now leave a review.",
      data: {
        orderId: order._id,
        confirmedAt: order.deliveryConfirmedAt,
        needsReview: !order.reviewSubmitted,
      },
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// 2. GET PENDING REVIEWS (For popup trigger)
// ============================================
exports.getPendingReviews = async (req, res) => {
  const endpoint = "getPendingReviews";

  try {
    const { buyerId } = req.query;

    if (!buyerId) {
      logger.warn(`${endpoint}: Missing buyerId`);
      return res.status(400).json({
        success: false,
        message: "Buyer ID is required",
      });
    }

    // Find delivered orders without reviews
    const pendingOrders = await Order.find({
      buyerId,
      deliveryConfirmedByBuyer: true,
      reviewSubmitted: false,
    })
      .populate("productId", "title pictures price averageRating totalReviews")
      .populate("sellerId", "username profileName email")
      .sort({ deliveryConfirmedAt: -1 })
      .limit(10);

    logger.info(`${endpoint}: Pending reviews fetched`, {
      buyerId,
      count: pendingOrders.length,
    });

    res.json({
      success: true,
      count: pendingOrders.length,
      message:
        pendingOrders.length > 0
          ? "You have pending reviews"
          : "No pending reviews",
      data: pendingOrders,
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// 3. SUBMIT REVIEW
// ============================================
exports.submitReview = async (req, res) => {
  const endpoint = "submitReview";
  const startTime = Date.now();

  try {
    const { orderId, rating, reviewText, buyerId } = req.body;

    // Validation
    if (!orderId || !rating || !buyerId) {
      logger.warn(`${endpoint}: Missing required fields`, { body: req.body });
      return res.status(400).json({
        success: false,
        message: "Order ID, rating, and buyer ID are required",
      });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      logger.warn(`${endpoint}: Invalid rating`, { rating });
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5",
      });
    }

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      logger.warn(`${endpoint}: Order not found`, { orderId });
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify buyer
    if (order.buyerId.toString() !== buyerId.toString()) {
      logger.warn(`${endpoint}: Unauthorized buyer`, { orderId, buyerId });
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You are not the buyer of this order.",
      });
    }

    // Check if delivery confirmed
    if (!order.deliveryConfirmedByBuyer) {
      logger.warn(`${endpoint}: Delivery not confirmed`, { orderId });
      return res.status(400).json({
        success: false,
        message: "Cannot submit review. Please confirm delivery first.",
      });
    }

    // Check if review already exists
    if (order.reviewSubmitted) {
      logger.warn(`${endpoint}: Review already submitted`, { orderId });
      return res.status(400).json({
        success: false,
        message: "Review already submitted for this order",
      });
    }

    // Create review
    const review = new Review({
      productId: order.productId,
      orderId: order._id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      rating: parseInt(rating),
      reviewText: reviewText || "",
      isVerifiedPurchase: true,
    });

    await review.save();

    // Update order
    order.reviewSubmitted = true;
    order.reviewId = review._id;
    await order.save();

    // Update product ratings
    await updateProductRatings(order.productId);

    logger.info(`${endpoint}: Review submitted successfully`, {
      reviewId: review._id,
      orderId,
      rating,
      duration: Date.now() - startTime + "ms",
    });

    // ✉️ OPTIONAL: Send email notification to seller
    /*
    const seller = await User.findById(order.sellerId);
    if (seller && seller.email) {
      await sendMail(
        seller.email,
        "New Review Received",
        `You have received a new ${rating}-star review for your product!`
      );
    }
    */

    res.status(201).json({
      success: true,
      message: "Review submitted successfully! Thank you for your feedback.",
      data: review,
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });

    // Handle duplicate review error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Review already exists for this order",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// 4. GET PRODUCT REVIEWS (For product page)
// ============================================
exports.getProductReviews = async (req, res) => {
  const endpoint = "getProductReviews";

  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "recent";
    const ratingFilter = req.query.rating
      ? parseInt(req.query.rating)
      : null;

    // Build query
    const query = {
      productId,
      status: "approved",
    };

    if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
      query.rating = ratingFilter;
    }

    // Build sort query
    let sortQuery = {};
    switch (sortBy) {
      case "highest":
        sortQuery = { rating: -1, createdAt: -1 };
        break;
      case "lowest":
        sortQuery = { rating: 1, createdAt: -1 };
        break;
      case "helpful":
        sortQuery = { helpfulCount: -1, createdAt: -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    // Get reviews with pagination
    const reviews = await Review.find(query)
      .populate("buyerId", "username profileName")
      .sort(sortQuery)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    // Get total count
    const totalReviews = await Review.countDocuments(query);

    logger.info(`${endpoint}: Reviews fetched`, {
      productId,
      count: reviews.length,
      page,
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        limit,
        hasMore: page < Math.ceil(totalReviews / limit),
      },
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// 5. GET PRODUCT RATING SUMMARY
// ============================================
exports.getProductRatingSummary = async (req, res) => {
  const endpoint = "getProductRatingSummary";

  try {
    const { productId } = req.params;

    // Get product with rating info
    const product = await Product.findById(productId).select(
      "averageRating totalReviews ratingDistribution title"
    );

    if (!product) {
      logger.warn(`${endpoint}: Product not found`, { productId });
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Calculate percentages
    const total = product.totalReviews || 1;
    const distributionPercentage = {
      fiveStar: parseFloat(
        ((product.ratingDistribution.fiveStar / total) * 100).toFixed(1)
      ),
      fourStar: parseFloat(
        ((product.ratingDistribution.fourStar / total) * 100).toFixed(1)
      ),
      threeStar: parseFloat(
        ((product.ratingDistribution.threeStar / total) * 100).toFixed(1)
      ),
      twoStar: parseFloat(
        ((product.ratingDistribution.twoStar / total) * 100).toFixed(1)
      ),
      oneStar: parseFloat(
        ((product.ratingDistribution.oneStar / total) * 100).toFixed(1)
      ),
    };

    logger.info(`${endpoint}: Rating summary fetched`, { productId });

    res.json({
      success: true,
      data: {
        productId: product._id,
        productTitle: product.title,
        averageRating: product.averageRating,
        totalReviews: product.totalReviews,
        distribution: product.ratingDistribution,
        distributionPercentage,
      },
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// 6. UPDATE REVIEW
// ============================================
exports.updateReview = async (req, res) => {
  const endpoint = "updateReview";

  try {
    const { reviewId } = req.params;
    const { rating, reviewText, buyerId } = req.body;

    if (!buyerId) {
      logger.warn(`${endpoint}: Missing buyerId`, { reviewId });
      return res.status(400).json({
        success: false,
        message: "Buyer ID is required",
      });
    }

    // Find review
    const review = await Review.findById(reviewId);

    if (!review) {
      logger.warn(`${endpoint}: Review not found`, { reviewId });
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Verify owner
    if (review.buyerId.toString() !== buyerId.toString()) {
      logger.warn(`${endpoint}: Unauthorized`, { reviewId, buyerId });
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You can only edit your own reviews.",
      });
    }

    // Update review
    let ratingChanged = false;

    if (rating !== undefined) {
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({
          success: false,
          message: "Rating must be an integer between 1 and 5",
        });
      }
      if (review.rating !== rating) {
        review.rating = rating;
        ratingChanged = true;
      }
    }

    if (reviewText !== undefined) {
      review.reviewText = reviewText;
    }

    review.updatedAt = new Date();
    await review.save();

    // Update product ratings if rating changed
    if (ratingChanged) {
      await updateProductRatings(review.productId);
    }

    logger.info(`${endpoint}: Review updated successfully`, { reviewId });

    res.json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// 7. DELETE REVIEW
// ============================================
exports.deleteReview = async (req, res) => {
  const endpoint = "deleteReview";

  try {
    const { reviewId } = req.params;
    const { buyerId } = req.body;

    if (!buyerId) {
      logger.warn(`${endpoint}: Missing buyerId`, { reviewId });
      return res.status(400).json({
        success: false,
        message: "Buyer ID is required",
      });
    }

    // Find review
    const review = await Review.findById(reviewId);

    if (!review) {
      logger.warn(`${endpoint}: Review not found`, { reviewId });
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Verify owner
    if (review.buyerId.toString() !== buyerId.toString()) {
      logger.warn(`${endpoint}: Unauthorized`, { reviewId, buyerId });
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You can only delete your own reviews.",
      });
    }

    const productId = review.productId;
    const orderId = review.orderId;

    // Delete review
    await Review.findByIdAndDelete(reviewId);

    // Update order
    await Order.findByIdAndUpdate(orderId, {
      reviewSubmitted: false,
      reviewId: null,
    });

    // Update product ratings
    await updateProductRatings(productId);

    logger.info(`${endpoint}: Review deleted successfully`, { reviewId });

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// 8. MARK REVIEW AS HELPFUL
// ============================================
exports.markReviewHelpful = async (req, res) => {
  const endpoint = "markReviewHelpful";

  try {
    const { reviewId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      logger.warn(`${endpoint}: Missing userId`, { reviewId });
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      logger.warn(`${endpoint}: Review not found`, { reviewId });
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if user already marked as helpful
    if (review.helpfulBy && review.helpfulBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "You have already marked this review as helpful",
      });
    }

    // Add user to helpfulBy array and increment count
    review.helpfulBy = review.helpfulBy || [];
    review.helpfulBy.push(userId);
    review.helpfulCount = review.helpfulBy.length;
    await review.save();

    logger.info(`${endpoint}: Marked as helpful`, { reviewId, userId });

    res.json({
      success: true,
      message: "Marked as helpful",
      data: { helpfulCount: review.helpfulCount },
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// 9. SELLER RESPONSE TO REVIEW
// ============================================
exports.addSellerResponse = async (req, res) => {
  const endpoint = "addSellerResponse";

  try {
    const { reviewId } = req.params;
    const { responseText, sellerId } = req.body;

    if (!responseText || responseText.trim() === "") {
      logger.warn(`${endpoint}: Missing response text`, { reviewId });
      return res.status(400).json({
        success: false,
        message: "Response text is required",
      });
    }

    if (!sellerId) {
      logger.warn(`${endpoint}: Missing sellerId`, { reviewId });
      return res.status(400).json({
        success: false,
        message: "Seller ID is required",
      });
    }

    // Find review
    const review = await Review.findById(reviewId);

    if (!review) {
      logger.warn(`${endpoint}: Review not found`, { reviewId });
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Verify seller
    if (review.sellerId.toString() !== sellerId.toString()) {
      logger.warn(`${endpoint}: Unauthorized seller`, { reviewId, sellerId });
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You are not the seller for this product.",
      });
    }

    // Add seller response
    review.sellerResponse = {
      text: responseText,
      respondedAt: new Date(),
    };
    review.updatedAt = new Date();
    await review.save();

    logger.info(`${endpoint}: Seller response added`, { reviewId, sellerId });

    res.json({
      success: true,
      message: "Response added successfully",
      data: review,
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// 10. GET USER'S REVIEWS (Buyer's review history)
// ============================================
exports.getUserReviews = async (req, res) => {
  const endpoint = "getUserReviews";

  try {
    const { buyerId } = req.query;

    if (!buyerId) {
      logger.warn(`${endpoint}: Missing buyerId`);
      return res.status(400).json({
        success: false,
        message: "Buyer ID is required",
      });
    }

    const reviews = await Review.find({ buyerId })
      .populate("productId", "title pictures price averageRating")
      .populate("sellerId", "username profileName")
      .sort({ createdAt: -1 });

    logger.info(`${endpoint}: User reviews fetched`, {
      buyerId,
      count: reviews.length,
    });

    res.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// 11. GET SELLER'S RECEIVED REVIEWS
// ============================================
exports.getSellerReceivedReviews = async (req, res) => {
  const endpoint = "getSellerReceivedReviews";

  try {
    const { sellerId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!sellerId) {
      logger.warn(`${endpoint}: Missing sellerId`);
      return res.status(400).json({
        success: false,
        message: "Seller ID is required",
      });
    }

    const reviews = await Review.find({ sellerId, status: "approved" })
      .populate("productId", "title pictures price")
      .populate("buyerId", "username profileName")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalReviews = await Review.countDocuments({
      sellerId,
      status: "approved",
    });

    // Calculate seller's overall rating
    const allReviews = await Review.find({ sellerId, status: "approved" });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageSellerRating =
      allReviews.length > 0
        ? parseFloat((totalRating / allReviews.length).toFixed(1))
        : 0;

    logger.info(`${endpoint}: Seller reviews fetched`, {
      sellerId,
      count: reviews.length,
    });

    res.json({
      success: true,
      data: reviews,
      summary: {
        totalReviews: allReviews.length,
        averageRating: averageSellerRating,
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews: totalReviews,
        limit,
      },
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// 12. GET REVIEW STATISTICS (Admin Dashboard)
// ============================================
exports.getReviewStatistics = async (req, res) => {
  const endpoint = "getReviewStatistics";

  try {
    const totalReviews = await Review.countDocuments();
    const approvedReviews = await Review.countDocuments({ status: "approved" });
    const pendingReviews = await Review.countDocuments({ status: "pending" });
    const rejectedReviews = await Review.countDocuments({ status: "rejected" });

    // Reviews by rating
    const reviewsByRating = await Review.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    // Recent reviews (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentReviews = await Review.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Average rating across all products
    const avgRatingResult = await Review.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const overallAverageRating =
      avgRatingResult.length > 0
        ? parseFloat(avgRatingResult[0].averageRating.toFixed(1))
        : 0;

    logger.info(`${endpoint}: Statistics retrieved successfully`);

    res.json({
      success: true,
      statistics: {
        total: totalReviews,
        byStatus: {
          approved: approvedReviews,
          pending: pendingReviews,
          rejected: rejectedReviews,
        },
        byRating: reviewsByRating,
        overallAverageRating,
        recentReviews: {
          last7Days: recentReviews,
        },
      },
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch review statistics",
      error: error.message,
    });
  }
};