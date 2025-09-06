"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Truck,
  Package,
  User,
  DollarSign,
  AlertTriangle,
  Clock,
  ShoppingBag,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ✅ toastify hooks
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "../../Hooks/Tostify";

const API_URL = `${import.meta.env.VITE_SERVER}/Orders`;

export default function SellerAdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [loading, setLoading] = useState(false); // page-level loader (initial fetch, etc.)
  const [loadingApprove, setLoadingApprove] = useState({}); // per-order "Approve & Ship"
  const [loadingReject, setLoadingReject] = useState({}); // per-order "Reject"
  const { i18n } = useTranslation();
  const sellerId = localStorage.getItem("userId");

  // Fetch seller orders
  // pass { page: false } to avoid showing the full-page spinner (so button spinners are visible)
  const fetchOrders = async (opts = { page: true }) => {
    const usePageSpinner = opts.page !== false;
    try {
      if (usePageSpinner) setLoading(true);
      const res = await axios.get(`${API_URL}/seller/${sellerId}`);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      showErrorToast("Failed to load orders");
      setOrders([]);
    } finally {
      if (usePageSpinner) setLoading(false);
    }
  };

  // Upload tracking ID (Approve & Ship)
  const handleUploadTracking = async (id) => {
    const trackingId = trackingInputs[id];
    if (!trackingId) {
      return showErrorToast("Enter a tracking ID");
    }

    setLoadingApprove((prev) => ({ ...prev, [id]: true })); // start per-button loader
    try {
      await axios.patch(`${API_URL}/${id}/tracking`, { trackingId });
      await fetchOrders({ page: false }); // refresh quietly so button loader is visible
      showSuccessToast(`Tracking ID uploaded for Order #${id}`);
    } catch (err) {
      console.error("Error uploading tracking ID:", err);
      showErrorToast("Failed to upload tracking ID");
    } finally {
      setLoadingApprove((prev) => ({ ...prev, [id]: false })); // stop per-button loader
    }
  };

  // Reject order
  const handleReject = async (id) => {
    setLoadingReject((prev) => ({ ...prev, [id]: true })); // start per-button loader
    try {
      await axios.post(`${import.meta.env.VITE_SERVER}/${id}/cancel`, {
        userId: "68a1bb9533d35012fa5e32fa", // replace with logged-in userId if needed
      });
      await fetchOrders({ page: false }); // refresh quietly
      showSuccessToast(`Order #${id} cancelled`);
    } catch (err) {
      console.error("Error cancelling order:", err);
      showErrorToast("Failed to cancel order");
    } finally {
      setLoadingReject((prev) => ({ ...prev, [id]: false })); // stop per-button loader
    }
  };

  // (unchanged) report example uses page spinner
  const handleReport = async (id) => {
    try {
      setLoading(true);
      await axios.patch(`${API_URL}/${id}/status`, { status: "reported" });
      await fetchOrders();
      showSuccessToast(`Order #${id} reported`);
    } catch (err) {
      console.error("Error reporting order:", err);
      showErrorToast("Failed to report order");
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedName = (nameObj) => {
    if (!nameObj) return "N/A";
    if (typeof nameObj === "string") return nameObj;
    return (
      nameObj[i18n.language] ||
      nameObj["en"] ||
      Object.values(nameObj)[0] ||
      "N/A"
    );
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "paid":
        return {
          bg: "bg-gradient-to-r from-amber-500 to-orange-500",
          text: "text-white",
          icon: Clock,
          label: "Paid",
        };
      case "shipped":
        return {
          bg: "bg-gradient-to-r from-blue-500 to-indigo-600",
          text: "text-white",
          icon: Truck,
          label: "Shipped",
        };
      case "delivered":
        return {
          bg: "bg-gradient-to-r from-emerald-500 to-green-600",
          text: "text-white",
          icon: CheckCircle,
          label: "Delivered",
        };
      case "cancelled":
        return {
          bg: "bg-gradient-to-r from-red-600 to-red-600",
          text: "text-white",
          icon: AlertTriangle,
          label: "Cancelled",
        };
      default:
        return {
          bg: "bg-gradient-to-r from-red-500 to-rose-600",
          text: "text-white",
          icon: AlertTriangle,
          label: status,
        };
    }
  };

  useEffect(() => {
    if (sellerId) fetchOrders();
  }, [sellerId]);

  return (
    <>
      <ToastifyContainer />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 flex justify-center">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-8">
          {/* Dashboard Header */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl p-8 mb-8 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Seller Dashboard
                  </h1>
                  <p className="text-slate-600 font-medium">
                    Manage your orders and shipments
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  showErrorToast("Report feature not yet implemented")
                }
                className="flex items-center gap-1 text-red-600 font-medium hover:underline cursor-pointer"
              >
                Report
                <AlertTriangle className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <Package className="w-5 h-5" />
                <span className="font-semibold">{orders.length}</span>
                <span>Total Orders</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">
                  {orders.filter((o) => o.status === "paid").length}
                </span>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">
                  {orders.filter((o) => o.status === "delivered").length}
                </span>
                <span>Completed</span>
              </div>
            </div>
          </div>

          {/* Orders Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <svg
                className="animate-spin h-10 w-10 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {orders.length > 0 ? (
                orders.map((order, index) => {
                  const statusConfig = getStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="h-full"
                    >
                      <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[380px] group">
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div>
                              <h2 className="text-lg font-bold text-slate-800">
                                Order #{order._id.slice(-8)}
                              </h2>
                              <p className="text-sm text-slate-500">
                                ID: {order._id}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`${statusConfig.bg} ${statusConfig.text} px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig.label}
                          </div>
                        </div>

                        {/* Order Info */}
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Package className="w-5 h-5 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-slate-600">
                                Product
                              </p>
                              <p className="font-semibold text-slate-800">
                                {getLocalizedName(order.productId?.title)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mb-3">
                            <User className="w-5 h-5 text-slate-500" />
                            <div>
                              <p className="text-sm font-medium text-slate-600">
                                Customer
                              </p>
                              <p className="font-semibold text-slate-800">
                                {getLocalizedName(order.checkoutDetails?.name) ||
                                  order.buyerId?.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <DollarSign className="w-5 h-5 text-slate-500" />
                            <div>
                              <p className="text-sm font-medium text-slate-600">
                                Total Amount
                              </p>
                              <p className="text-xl font-bold text-emerald-600">
                                ${order.total}
                              </p>
                            </div>
                          </div>

                          {order.trackingId && (
                            <div className="flex items-center gap-3 mb-3">
                              <Truck className="w-5 h-5 text-slate-500" />
                              <div>
                                <p className="text-sm font-medium text-slate-600">
                                  Tracking ID
                                </p>
                                <p className="font-semibold text-slate-800">
                                  {order.trackingId}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-6 pt-6 border-t border-slate-200">
                          {order.status === "paid" && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                  <Truck className="w-4 h-4" />
                                  Tracking Information
                                </label>
                                <input
                                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                  placeholder="Enter tracking ID..."
                                  value={trackingInputs[order._id] || ""}
                                  onChange={(e) =>
                                    setTrackingInputs({
                                      ...trackingInputs,
                                      [order._id]: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              <div className="flex gap-3">
                                {/* Approve & Ship with per-button loader */}
                                <button
                                  onClick={() => handleUploadTracking(order._id)}
                                  disabled={!!loadingApprove[order._id]}
                                  className={`flex-1 flex items-center justify-center bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-green-700 cursor-pointer ${
                                    loadingApprove[order._id]
                                      ? "opacity-70 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {loadingApprove[order._id] && (
                                    <svg
                                      className="animate-spin h-5 w-5 mr-2 text-white"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                      ></path>
                                    </svg>
                                  )}
                                  {loadingApprove[order._id]
                                    ? "Processing..."
                                    : "Approve & Ship"}
                                </button>

                                {/* Reject with per-button loader */}
                                <button
                                  onClick={() => handleReject(order._id)}
                                  disabled={!!loadingReject[order._id]}
                                  className={`flex-1 flex items-center justify-center bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-rose-700 cursor-pointer ${
                                    loadingReject[order._id]
                                      ? "opacity-70 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {loadingReject[order._id] && (
                                    <svg
                                      className="animate-spin h-5 w-5 mr-2 text-white"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                      ></path>
                                    </svg>
                                  )}
                                  {loadingReject[order._id]
                                    ? "Processing..."
                                    : "Reject"}
                                </button>
                              </div>
                            </div>
                          )}

                          {order.status === "completed" && (
                            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 mt-3">
                              <div className="flex items-center gap-3 text-emerald-700">
                                <CheckCircle className="w-5 h-5" />
                                <span>Payment Released</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full text-center bg-white/80 rounded-xl p-12 shadow">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No orders found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
