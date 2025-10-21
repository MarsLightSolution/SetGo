// ============================================
// REVIEW SYSTEM ROUTES
// File: routes/reviewRoutes.js
// ============================================

const express = require("express");
const router = express.Router();

// ========= IMPORT CONTROLLER =========
// ⚠️ ADJUST PATH ACCORDING TO YOUR PROJECT STRUCTURE
const reviewController = require("../controller/reviewController");

// You can also destructure if you prefer:
// const {
//   confirmDelivery,
//   getPendingReviews,
//   submitReview,
//   getProductReviews,
//   getProductRatingSummary,
//   updateReview,
//   deleteReview,
//   markReviewHelpful,
//   addSellerResponse,
//   getUserReviews,
//   getSellerReceivedReviews,
//   getReviewStatistics,
// } = require("../controller/reviewController");

// ============================================
// ✅ ALL ROUTES ARE PUBLIC (No authentication)
// Add verifyToken middleware later when you implement auth
// ============================================

// ========= BUYER ROUTES =========

// 1. Confirm delivery manually (triggers review popup eligibility)
// POST /api/reviews/orders/:orderId/confirm-delivery
// Body: { buyerId: "..." }
router.post("/orders/:orderId/confirm-delivery", reviewController.confirmDelivery);

// 2. Get pending reviews (for showing popup)
// GET /api/reviews/pending?buyerId=...
router.get("/pending", reviewController.getPendingReviews);

// 3. Submit a review
// POST /api/reviews
// Body: { orderId: "...", rating: 5, reviewText: "...", buyerId: "..." }
router.post("/", reviewController.submitReview);

// 4. Get user's own reviews (review history)
// GET /api/reviews/user?buyerId=...
router.get("/user", reviewController.getUserReviews);

// 5. Update own review
// PUT /api/reviews/:reviewId
// Body: { rating: 4, reviewText: "...", buyerId: "..." }
router.put("/:reviewId", reviewController.updateReview);

// 6. Delete own review
// DELETE /api/reviews/:reviewId
// Body: { buyerId: "..." }
router.delete("/:reviewId", reviewController.deleteReview);

// 7. Mark a review as helpful
// POST /api/reviews/:reviewId/helpful
// Body: { userId: "..." }
router.post("/:reviewId/helpful", reviewController.markReviewHelpful);

// ========= PRODUCT ROUTES (Public - anyone can view) =========

// 8. Get all reviews for a product (with pagination & filtering)
// GET /api/reviews/product/:productId?page=1&limit=10&sortBy=recent&rating=5
router.get("/product/:productId", reviewController.getProductReviews);

// 9. Get product rating summary (for product header)
// GET /api/reviews/product/:productId/summary
router.get("/product/:productId/summary", reviewController.getProductRatingSummary);

// ========= SELLER ROUTES =========

// 10. Get all reviews received by seller
// GET /api/reviews/seller?sellerId=...&page=1&limit=20
router.get("/seller", reviewController.getSellerReceivedReviews);

// 11. Seller responds to a review
// POST /api/reviews/:reviewId/seller-response
// Body: { responseText: "...", sellerId: "..." }
router.post("/:reviewId/seller-response", reviewController.addSellerResponse);

// ========= ADMIN ROUTES (Statistics & Moderation) =========

// 12. Get review statistics (for admin dashboard)
// GET /api/reviews/admin/statistics
router.get("/admin/statistics", reviewController.getReviewStatistics);

// ⚠️ ADD MORE ADMIN ROUTES IF NEEDED (approve/reject reviews, etc.)
// Example:
// router.patch("/admin/:reviewId/approve", reviewController.approveReview);
// router.patch("/admin/:reviewId/reject", reviewController.rejectReview);

// ============================================
// EXPORT ROUTER
// ============================================
module.exports = router;