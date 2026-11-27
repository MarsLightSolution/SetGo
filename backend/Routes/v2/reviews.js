// /api/v2/reviews — like /reviews. Reading product reviews stays public; everything tied to a
// person needs login, and buyerId/sellerId/userId are always the logged-in user.
const express = require("express");
const verifyJWT = require("../../middlewares/auth.middlewares");
const { asSelf, adminOnly } = require("../../middlewares/v2Guards.middleware");
const c = require("../../controller/reviewController");

const router = express.Router();
const me = (field) => [verifyJWT, asSelf(field)];

router.post("/orders/:orderId/confirm-delivery", ...me("buyerId"), c.confirmDelivery);
router.get("/pending", ...me("buyerId"), c.getPendingReviews);
router.post("/", ...me("buyerId"), c.submitReview);
router.get("/user", ...me("buyerId"), c.getUserReviews);
router.get("/seller", ...me("sellerId"), c.getSellerReceivedReviews);
router.get("/admin/statistics", verifyJWT, adminOnly, c.getReviewStatistics);
router.get("/product/:productId", c.getProductReviews);
router.get("/product/:productId/summary", c.getProductRatingSummary);
router.put("/:reviewId", ...me("buyerId"), c.updateReview);
router.delete("/:reviewId", ...me("buyerId"), c.deleteReview);
router.post("/:reviewId/helpful", ...me("userId"), c.markReviewHelpful);
router.post("/:reviewId/seller-response", ...me("sellerId"), c.addSellerResponse);

module.exports = router;
