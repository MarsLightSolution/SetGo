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

const verifyJWT = require("../middlewares/auth.middlewares.js");

// ============================================
// SECURITY: reading product reviews is public. Everything tied to a person needs a login, and
// the person is always the logged-in user: any buyerId / sellerId / userId the client sends (in
// the body or the query) is overwritten with the id from the verified token, so the controllers'
// "is this your order / your review" checks can't be bypassed by sending someone else's id.
// ============================================
const asSelf = (...fields) => (req, res, next) => {
  const me = String(req.user._id);
  req.body = req.body || {};
  for (const f of fields) {
    req.body[f] = me;
    if (req.query) req.query[f] = me;
  }
  next();
};
const requireAdmin = (req, res, next) =>
  req.user?.role === "admin" ? next() : res.status(403).json({ success: false, message: "Admin access required" });

// ========= BUYER ROUTES =========

// 1. Confirm delivery manually (triggers review popup eligibility)
// POST /api/reviews/orders/:orderId/confirm-delivery
// Body: { buyerId: "..." }
router.post("/orders/:orderId/confirm-delivery", verifyJWT, asSelf("buyerId"), reviewController.confirmDelivery);

// 2. Get pending reviews (for showing popup)
// GET /api/reviews/pending?buyerId=...
router.get("/pending", verifyJWT, asSelf("buyerId"), reviewController.getPendingReviews);

// 3. Submit a review
// POST /api/reviews
// Body: { orderId: "...", rating: 5, reviewText: "...", buyerId: "..." }
router.post("/", verifyJWT, asSelf("buyerId"), reviewController.submitReview);

// 4. Get user's own reviews (review history)
// GET /api/reviews/user?buyerId=...
router.get("/user", verifyJWT, asSelf("buyerId"), reviewController.getUserReviews);

// 5. Update own review
// PUT /api/reviews/:reviewId
// Body: { rating: 4, reviewText: "...", buyerId: "..." }
router.put("/:reviewId", verifyJWT, asSelf("buyerId"), reviewController.updateReview);

// 6. Delete own review
// DELETE /api/reviews/:reviewId
// Body: { buyerId: "..." }
router.delete("/:reviewId", verifyJWT, asSelf("buyerId"), reviewController.deleteReview);

// 7. Mark a review as helpful
// POST /api/reviews/:reviewId/helpful
// Body: { userId: "..." }
router.post("/:reviewId/helpful", verifyJWT, asSelf("userId"), reviewController.markReviewHelpful);

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
router.post("/:reviewId/seller-response", verifyJWT, asSelf("sellerId"), reviewController.addSellerResponse);

// ========= ADMIN ROUTES (Statistics & Moderation) =========

// 12. Get review statistics (for admin dashboard)
// GET /api/reviews/admin/statistics
router.get("/admin/statistics", verifyJWT, requireAdmin, reviewController.getReviewStatistics);

// ⚠️ ADD MORE ADMIN ROUTES IF NEEDED (approve/reject reviews, etc.)
// Example:
// router.patch("/admin/:reviewId/approve", reviewController.approveReview);
// router.patch("/admin/:reviewId/reject", reviewController.rejectReview);

// ============================================
// EXPORT ROUTER
// ============================================
module.exports = router;