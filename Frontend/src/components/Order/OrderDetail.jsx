import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
  Package,
  User,
  MapPin,
  Mail,
  CreditCard,
  Truck,
  Clock,
  Star,
  Edit2,
  Trash2,
  Check,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";

const OrderDetail = () => {
  const { id } = useParams();
  const { i18n } = useTranslation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifyClicked, setNotifyClicked] = useState(false);

  // Review states
  const [review, setReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 0,
    reviewText: "",
  });
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const lang = i18n.language || "en";

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_SERVER}/Orders/${id}`
      );
      if (data.success) {
        setOrder(data.data);

        // Check if delivery is confirmed
        if (
          data.data?.status === "delivered" ||
          data.data?.deliveryConfirmedByBuyer
        ) {
          setNotifyClicked(true);

          // Fetch review if order has been reviewed
          if (data.data?.reviewSubmitted) {
            fetchUserReview(data.data.buyerId._id || data.data.buyerId);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReview = async (buyerId) => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_SERVER}/reviews/user?buyerId=${buyerId}`
      );
      if (data.success && data.data) {
        const orderReview = data.data.find(
          (r) => r.orderId?._id === id || r.orderId === id
        );
        if (orderReview) {
          setReview(orderReview);
          setReviewFormData({
            rating: orderReview.rating,
            reviewText: orderReview.reviewText || "",
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch review:", err);
    }
  };

  const handleNotifyClick = async () => {
    if (!order) return;

    try {
      setNotifyClicked(true);

      const buyerId = order.buyerId._id || order.buyerId;

      await axios.post(
        `${import.meta.env.VITE_SERVER}/reviews/confirm-delivery/${id}`,
        { buyerId }
      );

      // Update order state
      setOrder((prev) => ({
        ...prev,
        status: "delivered",
        deliveryConfirmedByBuyer: true,
        deliveryConfirmedAt: new Date(),
      }));

      // Show review form after a short delay
      setTimeout(() => {
        setShowReviewForm(true);
      }, 1500);
    } catch (err) {
      console.error("Failed to confirm delivery:", err);
      alert(err.response?.data?.message || "Failed to confirm delivery");
      setNotifyClicked(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!order) return;

    if (reviewFormData.rating === 0) {
      alert("Please select a rating");
      return;
    }

    setReviewLoading(true);

    try {
      const buyerId = order.buyerId._id || order.buyerId;

      if (isEditingReview && review) {
        // Update existing review
        const { data } = await axios.put(
          `${import.meta.env.VITE_SERVER}/reviews/${review._id}`,
          {
            rating: reviewFormData.rating,
            reviewText: reviewFormData.reviewText,
            buyerId,
          }
        );

        if (data.success) {
          setReview(data.data);
          setIsEditingReview(false);
          setShowReviewForm(false);
          alert("Review updated successfully!");
        }
      } else {
        // Submit new review
        const { data } = await axios.post(
          `${import.meta.env.VITE_SERVER}/reviews`,
          {
            orderId: id,
            rating: reviewFormData.rating,
            reviewText: reviewFormData.reviewText,
            buyerId,
          }
        );

        if (data.success) {
          setReview(data.data);
          setShowReviewForm(false);
          setOrder((prev) => ({
            ...prev,
            reviewSubmitted: true,
            reviewId: data.data._id,
          }));
          alert("Review submitted successfully! Thank you for your feedback.");
        }
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert(err.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!order || !review) return;

    if (!window.confirm("Are you sure you want to delete your review?")) return;

    try {
      const buyerId = order.buyerId._id || order.buyerId;

      const { data } = await axios.delete(
        `${import.meta.env.VITE_SERVER}/reviews/${review._id}`,
        { data: { buyerId } }
      );

      if (data.success) {
        setReview(null);
        setReviewFormData({ rating: 0, reviewText: "" });
        setOrder((prev) => ({
          ...prev,
          reviewSubmitted: false,
          reviewId: null,
        }));
        alert("Review deleted successfully");
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
      alert(err.response?.data?.message || "Failed to delete review");
    }
  };

  const handleEditReview = () => {
    setIsEditingReview(true);
    setShowReviewForm(true);
  };

  const handleCancelEdit = () => {
    setIsEditingReview(false);
    setShowReviewForm(false);
    if (review) {
      setReviewFormData({
        rating: review.rating,
        reviewText: review.reviewText || "",
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= (interactive ? hoveredStar || reviewFormData.rating : rating);
      stars.push(
        <div
          key={i}
          className={`relative ${interactive ? "cursor-pointer" : ""}`}
          onMouseEnter={() => interactive && setHoveredStar(i)}
          onMouseLeave={() => interactive && setHoveredStar(0)}
          onClick={() =>
            interactive && setReviewFormData({ ...reviewFormData, rating: i })
          }
        >
          <Star
            className={`w-8 h-8 transition-all duration-200 ${
              isFilled
                ? "fill-yellow-400 text-yellow-400 scale-110"
                : "text-gray-300"
            } ${interactive ? "hover:scale-125" : ""}`}
            style={{
              filter: isFilled ? "drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))" : "none",
            }}
          />
        </div>
      );
    }
    return <div className="flex gap-2">{stars}</div>;
  };

  const renderSmallStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  if (!order)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-xl">Order not found</p>
        </div>
      </div>
    );

  const status = order.status?.toLowerCase();
  const canReview =
    status === "delivered" &&
    order.deliveryConfirmedByBuyer &&
    !order.reviewSubmitted;
  const hasReview = order.reviewSubmitted && review;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">Order Details</h1>
                <p className="mt-1 text-blue-100 text-sm">
                  Order #{order._id?.slice(-8).toUpperCase()}
                  <span className="mx-2">•</span>
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-lg font-semibold text-white shadow-lg ${
                  status === "paid"
                    ? "bg-yellow-500"
                    : status === "shipped"
                    ? "bg-blue-500"
                    : status === "delivered"
                    ? "bg-green-500"
                    : status === "cancelled"
                    ? "bg-red-500"
                    : "bg-gray-500"
                }`}
              >
                {order.status?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-6">
            {/* Item Info */}
            <div className="flex gap-6 items-center bg-gray-50 p-4 rounded-xl">
              <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center shadow-md">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-bold text-gray-900 text-xl">
                  {order.productId?.title?.[lang] ||
                    order.productId?.title?.en ||
                    "N/A"}
                </h3>
                <p className="text-gray-600 text-sm">
                  {order.productId?.description?.[lang] ||
                    order.productId?.description?.en ||
                    "No description"}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  ID: {order.productId?._id || "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  ₼ {order.productId?.price || 0}
                </p>
              </div>
            </div>

            <div className="border-t-2 border-gray-200"></div>

            {/* Delivery Status */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Truck className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  {status === "paid" && (
                    <p className="text-gray-800 font-medium">
                      Order confirmed. We will notify you once shipping starts.
                    </p>
                  )}
                  {status === "shipped" && (
                    <div className="space-y-3">
                      <p className="text-blue-800 font-semibold flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Your order is on the way
                        {order.trackingId && (
                          <span className="text-sm text-gray-600">
                            (Tracking: {order.trackingId})
                          </span>
                        )}
                      </p>
                      <div className="bg-white border-2 border-blue-300 rounded-lg p-4 flex items-center gap-4">
                        <p className="text-gray-800 flex-1 font-medium">
                          Have you received your order?
                        </p>
                        <button
                          onClick={handleNotifyClick}
                          disabled={notifyClicked}
                          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                            notifyClicked
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                          }`}
                        >
                          {notifyClicked ? "✓ Confirmed" : "Confirm Delivery"}
                        </button>
                      </div>
                    </div>
                  )}
                  {status === "delivered" && (
                    <div className="space-y-2">
                      <p className="text-green-700 font-semibold flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        Order delivered successfully!
                      </p>
                      {order.deliveryConfirmedAt && (
                        <p className="text-sm text-gray-600">
                          Delivered on {formatDate(order.deliveryConfirmedAt)}
                        </p>
                      )}
                    </div>
                  )}
                  {status === "cancelled" && (
                    <p className="text-red-600 font-semibold">
                      This order has been cancelled. Please contact support for
                      refund information.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Review Section - Only for DELIVERED orders */}
            {status === "delivered" && order.deliveryConfirmedByBuyer && (
              <>
                <div className="border-t-2 border-gray-200"></div>

                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200 shadow-lg">
                  <h2 className="text-gray-800 font-bold text-xl flex items-center gap-2 mb-4">
                    <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                    Product Review
                  </h2>

                  {/* Existing Review Display */}
                  {hasReview && !showReviewForm && (
                    <div className="bg-white rounded-xl p-5 shadow-md space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {renderSmallStars(review.rating)}
                            <span className="text-sm font-semibold text-gray-700">
                              Your Rating: {review.rating}/5
                            </span>
                          </div>
                          {review.reviewText && (
                            <p className="text-gray-700 leading-relaxed">
                              {review.reviewText}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-3">
                            {review.isVerifiedPurchase && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                                <Check className="h-3 w-3" />
                                Verified Purchase
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={handleEditReview}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
                            title="Edit Review"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={handleDeleteReview}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                            title="Delete Review"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Seller Response */}
                      {review.sellerResponse && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-5 w-5 text-blue-600 mt-1" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-blue-900 mb-1">
                                Seller Response:
                              </p>
                              <p className="text-sm text-gray-700">
                                {review.sellerResponse.text}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {formatDate(review.sellerResponse.respondedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review Form */}
                  {(canReview || showReviewForm) && (
                    <div className="bg-white rounded-xl p-5 shadow-md space-y-5">
                      <div>
                        <label className="block text-base font-semibold text-gray-800 mb-3">
                          How would you rate this product?
                        </label>
                        <div className="flex flex-col items-center gap-3 py-4">
                          {renderStars(reviewFormData.rating, true)}
                          <span className="text-lg font-bold text-gray-700">
                            {reviewFormData.rating > 0
                              ? `${reviewFormData.rating} Star${
                                  reviewFormData.rating > 1 ? "s" : ""
                                }`
                              : "Click to rate"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-base font-semibold text-gray-800 mb-2">
                          Share your experience (optional)
                        </label>
                        <textarea
                          value={reviewFormData.reviewText}
                          onChange={(e) =>
                            setReviewFormData({
                              ...reviewFormData,
                              reviewText: e.target.value,
                            })
                          }
                          placeholder="Tell others what you think about this product..."
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none transition-all"
                          rows="4"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleSubmitReview}
                          disabled={reviewLoading || reviewFormData.rating === 0}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                        >
                          {reviewLoading
                            ? "Submitting..."
                            : isEditingReview
                            ? "Update Review"
                            : "Submit Review"}
                        </button>
                        {isEditingReview && (
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all font-semibold"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CTA Button */}
                  {canReview && !showReviewForm && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                    >
                      <Star className="h-6 w-6 fill-white" />
                      Share Your Experience
                    </button>
                  )}
                </div>
              </>
            )}

            <div className="border-t-2 border-gray-200"></div>

            {/* Delivery Address */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h2 className="text-gray-800 font-bold text-lg flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-red-500" /> Delivery Address
              </h2>
              <div className="space-y-1 text-gray-700">
                <p className="font-semibold text-base">
                  {order.checkoutDetails?.name || "N/A"}
                </p>
                <p className="text-sm">{order.checkoutDetails?.address || "N/A"}</p>
                <p className="text-sm">
                  {order.checkoutDetails?.city || "N/A"},{" "}
                  {order.checkoutDetails?.pincode || "N/A"}
                </p>
                <p className="text-sm flex items-center gap-1 mt-2">
                  <Mail className="h-4 w-4" />
                  {order.checkoutDetails?.email || "N/A"}
                </p>
              </div>
            </div>

            <div className="border-t-2 border-gray-200"></div>

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h2 className="text-gray-800 font-bold text-lg flex items-center gap-2 mb-3">
                <CreditCard className="h-5 w-5 text-blue-600" /> Payment Summary
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Item Total</span>
                  <span className="font-semibold">₼ {order.productId?.price || 0}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery Charges</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
                <div className="border-t-2 border-gray-300 my-2"></div>
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-green-600">₼ {order.total || 0}</span>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-gray-200"></div>

            {/* Seller Info */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5">
              <h2 className="text-gray-800 font-bold text-lg flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-purple-600" /> Seller Information
              </h2>
              <div className="space-y-1 text-gray-700">
                <p className="font-semibold text-base">
                  {order.sellerId?.username || "N/A"}
                </p>
                <p className="text-sm">{order.sellerId?.email || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;