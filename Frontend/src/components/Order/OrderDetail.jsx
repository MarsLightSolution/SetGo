import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import SafeImage from "../common/SafeImage";
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
  const { t, i18n } = useTranslation();
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
      const token = localStorage.getItem("accessToken");
      const { data } = await axios.get(
        `${import.meta.env.VITE_SERVER}/Orders/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
      alert(err.response?.data?.message || t("orderDetail.failedToConfirmDelivery"));
      setNotifyClicked(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!order) return;

    if (reviewFormData.rating === 0) {
      alert(t("orderDetail.pleaseSelectRating"));
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
          alert(t("orderDetail.reviewUpdatedSuccess"));
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
          alert(t("orderDetail.reviewSubmittedSuccess"));
        }
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert(err.response?.data?.message || t("orderDetail.failedToSubmitReview"));
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!order || !review) return;

    if (!window.confirm(t("orderDetail.confirmDeleteReview"))) return;

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
        alert(t("orderDetail.reviewDeletedSuccess"));
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
      alert(err.response?.data?.message || t("orderDetail.failedToDeleteReview"));
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

  const renderStars = (rating, interactive = false) => {
    const stars = [];
    const displayRating = interactive ? hoveredStar || rating : rating;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-5 w-5 cursor-pointer transition-all duration-200 ${
            i <= displayRating
              ? "fill-lime-500 text-lime-500 drop-shadow"
              : "text-gray-300 hover:text-lime-300"
          } ${interactive ? "hover:scale-110" : ""}`}
          onClick={() =>
            interactive &&
            setReviewFormData({ ...reviewFormData, rating: i })
          }
          onMouseEnter={() => interactive && setHoveredStar(i)}
          onMouseLeave={() => interactive && setHoveredStar(0)}
        />
      );
    }
    return <div className="flex gap-1">{stars}</div>;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-lime-400 text-gray-900";
      case "shipped":
        return "bg-blue-500 text-white";
      case "processing":
        return "bg-amber-500 text-white";
      case "pending":
        return "bg-gray-500 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const formatDate = (date) => {
    if (!date) return t("orderDetail.na");
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const canReview =
    order &&
    (order.status === "delivered" || order.deliveryConfirmedByBuyer) &&
    !order.reviewSubmitted &&
    !review;

  if (loading) {
    return (
      <div className="min-h-screen bg-lime-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-lime-500 mb-3"></div>
          <p className="text-sm font-semibold text-gray-700">{t("orderDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-lime-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-6">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800 mb-1">{t("orderDetail.orderNotFound")}</h2>
          <p className="text-sm text-gray-600">{t("orderDetail.orderDoesntExist")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lime-50 py-4 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-lime-400 p-4 text-gray-900">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("orderDetail.orderInvoice")}
            </h1>
            <p className="text-gray-800 text-xs mt-1 truncate">
              {t("orderDetail.orderId")}: <span className="font-mono font-semibold break-all">{order._id}</span>
            </p>
          </div>

          <div className="p-4 space-y-4">
            {/* Product Info */}
            <div className="bg-lime-50 rounded-lg p-4 shadow border border-lime-200">
              <div className="flex gap-4">
                <div className="flex-shrink-0 overflow-hidden rounded-lg">
                  <SafeImage
                    src={order.productId?.images?.[0]}
                    alt={order.productId?.productName?.[lang] || t("orderDetail.product")}
                    className="w-24 h-24 object-cover rounded-lg shadow border border-lime-300"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
                  <h2 className="text-base font-bold text-gray-800 line-clamp-2">
                    {order.productId?.title?.[lang] || t("orderDetail.na")}
                  </h2>
                  <p className="text-gray-600 text-xs line-clamp-2">
                    {order.productId?.description?.[lang] || t("orderDetail.noDescription")}
                  </p>
                  <div className="flex flex-wrap gap-2 items-center mt-2">
                    <span className="text-xl font-bold text-lime-600">
                      ₼ {order.productId?.price || 0}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full font-bold text-xs shadow ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg p-3 shadow border border-gray-200">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-lime-500" />
                {t("orderDetail.orderTimeline")}
              </h2>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-lime-500"></div>
                  <span className="text-gray-700">
                    <span className="font-semibold">{t("orderDetail.ordered")}:</span> {formatDate(order.createdAt)}
                  </span>
                </div>
                {order.deliveryConfirmedAt && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-gray-700">
                      <span className="font-semibold">{t("orderDetail.delivered")}:</span>{" "}
                      {formatDate(order.deliveryConfirmedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Confirmation */}
            {order.status !== "cancelled" && !notifyClicked && (
              <div className="bg-lime-100 rounded-lg p-4 shadow border border-lime-300">
                <div className="text-center space-y-3">
                  <Truck className="h-10 w-10 text-lime-600 mx-auto" />
                  <h3 className="text-sm font-bold text-gray-800">
                    {t("orderDetail.haveYouReceived")}
                  </h3>
                  <button
                    onClick={handleNotifyClick}
                    className="px-6 py-2 bg-lime-400 text-gray-900 rounded-lg hover:bg-lime-500 transition-all font-bold text-sm shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    {t("orderDetail.confirmDelivery")}
                  </button>
                </div>
              </div>
            )}

            {/* Review Section */}
            {notifyClicked && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-lime-400 rounded-lg p-3 shadow">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Star className="h-5 w-5 fill-gray-900" />
                      {t("orderDetail.productReview")}
                    </h2>
                    {review && (
                      <span className="bg-white text-lime-600 px-3 py-1 rounded-full font-bold text-xs">
                        {t("orderDetail.submitted")}
                      </span>
                    )}
                  </div>

                  {/* Existing Review Display */}
                  {review && !showReviewForm && (
                    <div className="space-y-3">
                      <div className="bg-lime-50 rounded-lg p-4 shadow border border-lime-200">
                        <div className="flex gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <span className="text-sm font-bold text-lime-600 bg-lime-100 px-2 py-1 rounded-full">
                                {review.rating}/5
                              </span>
                            </div>
                            {review.reviewText && (
                              <p className="text-gray-700 text-sm leading-relaxed line-clamp-4 break-words">
                                "{review.reviewText}"
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              {review.isVerifiedPurchase && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-lime-700 bg-lime-100 px-2 py-1 rounded-full">
                                  <Check className="h-3 w-3" />
                                  {t("orderDetail.verified")}
                                </span>
                              )}
                              <span className="text-xs text-gray-600">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={handleEditReview}
                              className="p-2 text-lime-600 bg-lime-50 hover:bg-lime-100 rounded-lg transition-all"
                              title={t("orderDetail.edit")}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleDeleteReview}
                              className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                              title={t("orderDetail.delete")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Seller Response */}
                        {review.sellerResponse && (
                          <div className="bg-lime-50 p-3 rounded-lg border-l-4 border-lime-500 mt-3">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-lime-600 mt-1" />
                              <div className="flex-1">
                                <p className="text-xs font-bold text-lime-900 mb-1">
                                  {t("orderDetail.sellerResponse")}:
                                </p>
                                <p className="text-xs text-gray-700">
                                  {review.sellerResponse.text}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(review.sellerResponse.respondedAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Review Form */}
                  {(canReview || showReviewForm) && (
                    <div className="bg-lime-50 rounded-lg p-4 shadow border border-lime-200 space-y-3">
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                          {t("orderDetail.rateThisProduct")}
                        </label>
                        <div className="flex flex-col items-center gap-2 py-3 bg-white rounded-lg">
                          {renderStars(reviewFormData.rating, true)}
                          <span className="text-sm font-bold text-gray-800 bg-lime-100 px-3 py-1 rounded-full">
                            {reviewFormData.rating > 0
                              ? t("orderDetail.starCount", { count: reviewFormData.rating })
                              : t("orderDetail.clickToRate")}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                          {t("orderDetail.yourFeedback")}
                        </label>
                        <textarea
                          value={reviewFormData.reviewText}
                          onChange={(e) =>
                            setReviewFormData({
                              ...reviewFormData,
                              reviewText: e.target.value,
                            })
                          }
                          placeholder={t("orderDetail.shareExperience")}
                          className="w-full px-3 py-2 border border-lime-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-300 resize-none text-sm"
                          rows="3"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSubmitReview}
                          disabled={reviewLoading || reviewFormData.rating === 0}
                          className="flex-1 px-4 py-2 bg-lime-400 text-gray-900 rounded-lg hover:bg-lime-500 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-sm shadow"
                        >
                          {reviewLoading
                            ? t("orderDetail.submitting")
                            : isEditingReview
                            ? t("orderDetail.update")
                            : t("orderDetail.submitReview")}
                        </button>
                        {isEditingReview && (
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all font-bold text-sm"
                          >
                            {t("orderDetail.cancel")}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CTA Button */}
                  {canReview && !showReviewForm && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="w-full py-3 bg-lime-400 text-gray-900 rounded-lg hover:bg-lime-500 transition-all font-bold text-sm shadow flex items-center justify-center gap-2"
                    >
                      <Star className="h-5 w-5 fill-gray-900" />
                      {t("orderDetail.rateThisProduct")}
                    </button>
                  )}
                </div>
              </>
            )}

            <div className="border-t border-gray-200"></div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-red-500" /> {t("orderDetail.deliveryAddress")}
              </h2>
              <div className="space-y-1 text-xs text-gray-700">
                <p className="font-bold text-gray-900">
                  {order.checkoutDetails?.name || t("orderDetail.na")}
                </p>
                <p>{order.checkoutDetails?.address || t("orderDetail.na")}</p>
                <p>
                  {order.checkoutDetails?.city || t("orderDetail.na")},{" "}
                  {order.checkoutDetails?.pincode || t("orderDetail.na")}
                </p>
                <p className="flex items-center gap-1 mt-1">
                  <Mail className="h-3 w-3 text-gray-600" />
                  {order.checkoutDetails?.email || t("orderDetail.na")}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

            {/* Payment Summary */}
            <div className="bg-lime-50 rounded-lg p-4 shadow border border-lime-200">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-lime-600" /> {t("orderDetail.paymentSummary")}
              </h2>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-gray-700">
                  <span>{t("orderDetail.itemTotal")}</span>
                  <span className="font-bold">₼ {order.productId?.price || 0}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>{t("orderDetail.deliveryCharges")}</span>
                  <span className="text-lime-600 font-bold">{t("orderDetail.free")}</span>
                </div>
                <div className="border-t border-lime-300 my-1"></div>
                <div className="flex justify-between text-sm font-bold text-gray-900 bg-white rounded-lg p-2">
                  <span>{t("orderDetail.totalAmount")}</span>
                  <span className="text-lime-600">₼ {order.total || 0}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

            {/* Seller Info */}
            <div className="bg-lime-100 rounded-lg p-4 shadow border border-lime-300">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-lime-600" /> {t("orderDetail.sellerInformation")}
              </h2>
              <div className="space-y-1 text-xs text-gray-700">
                <p className="font-bold text-gray-900">
                  {order.sellerId?.username || t("orderDetail.na")}
                </p>
                <p className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-gray-600" />
                  {order.sellerId?.email || t("orderDetail.na")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;