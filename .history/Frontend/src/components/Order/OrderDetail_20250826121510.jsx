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
} from "lucide-react";

const OrderDetail = () => {
  const { id } = useParams();
  const { i18n } = useTranslation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifyClicked, setNotifyClicked] = useState(false);

  const lang = i18n.language || "en";

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_SERVER}/Orders/${id}`);
        if (data.success) setOrder(data.data);

        // If already delivered, mark notify button as clicked
        if (data.data?.status === "delivered") {
          setNotifyClicked(true);
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleNotifyClick = async () => {
    try {
      setNotifyClicked(true);

      await axios.post(
        `${import.meta.env.VITE_SERVER}/${id}/approve-delivery`,
        { userId: "68a1bb9533d35012fa5e32fa" } // send buyer id
      );

      // ✅ Update UI to delivered immediately
      setOrder((prev) => ({
        ...prev,
        status: "delivered",
      }));
    } catch (err) {
      console.error("Failed to notify delivery:", err);
      setNotifyClicked(false); // rollback if failed
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

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading order details...
      </div>
    );

  if (!order)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Order not found.
      </div>
    );

  const status = order.status?.toLowerCase();

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10 px-4">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Order #{order._id?.slice(-8).toUpperCase()}
              <span className="mx-2">•</span>
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`px-4 py-1 rounded font-medium text-white ${
                status === "paid"
                  ? "bg-yellow-500"
                  : status === "shipped"
                  ? "bg-blue-500"
                  : status === "delivered"
                  ? "bg-green-600"
                  : status === "cancelled"
                  ? "bg-red-600"
                  : "bg-gray-400"
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Item Info */}
          <div className="flex gap-6 items-center">
            <div className="w-36 h-36 bg-gray-100 rounded-lg flex items-center justify-center shadow-sm">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-gray-900 text-xl">
                {order.productId?.title?.[lang] ||
                  order.productId?.title?.en ||
                  "N/A"}
              </h3>
              <p className="text-gray-600 text-sm">
                {order.productId?.description?.[lang] ||
                  order.productId?.description?.en ||
                  "N/A"}
              </p>
              <p className="text-sm text-gray-500 font-mono">
                Product ID: {order.productId?._id || "N/A"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-green-700">
                € {order.productId?.price || 0}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200"></div>

          {/* Delivery Status */}
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              {status === "paid" && (
                <p className="text-gray-700 font-medium">
                  Order confirmed. We will notify you once shipping starts.
                </p>
              )}
              {status === "shipped" && (
                <div className="space-y-2 w-full">
                  <p className="text-blue-800 font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Your order is being shipped{" "}
                    {order.trackingId && `(Tracking ID: ${order.trackingId})`}
                  </p>
                  <div className="flex items-center bg-blue-50 border border-blue-200 rounded-md px-4 py-2 gap-4">
                    <p className="text-gray-800 text-sm md:text-base flex-1">
                      Notify us when your order is delivered
                    </p>
                    <button
                      onClick={handleNotifyClick}
                      disabled={notifyClicked}
                      className={`text-sm px-3 py-1 rounded-md transition ${
                        notifyClicked
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {notifyClicked ? "Notified" : "Notify"}
                    </button>
                  </div>
                </div>
              )}
              {status === "delivered" && (
                <p className="text-green-800 font-medium">
                  Your order has been delivered
                </p>
              )}
              {status === "cancelled" && (
                <p className="text-red-600 font-medium">
                  This order has been cancelled. If you have already paid,
                  please check for a refund.
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200"></div>

          {/* Delivery Info */}
          <div>
            <h2 className="text-gray-800 font-semibold flex items-center gap-2 mb-1">
              <MapPin className="h-5 w-5 text-red-500 text-lg" /> Delivery
              Address
            </h2>
            <p className="font-semibold text-gray-900 text-sm">
              {order.checkoutDetails?.name || "N/A"}
            </p>
            <p className="text-gray-600 text-sm">
              {order.checkoutDetails?.address || "N/A"}
            </p>
            <p className="text-gray-600 text-sm">
              {order.checkoutDetails?.city || "N/A"},{" "}
              {order.checkoutDetails?.pincode || "N/A"}
            </p>
            <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
              <Mail className="h-4 w-4" /> {order.checkoutDetails?.email || "N/A"}
            </p>
          </div>

          <div className="border-t border-gray-200"></div>

          {/* Payment Summary */}
          <div>
            <h2 className="text-gray-800 font-semibold flex items-center gap-2 mb-1">
              <CreditCard className="h-5 w-5 text-blue-600 text-lg" /> Payment
              Summary
            </h2>
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Item total</span>
              <span>€{order.productId?.price || 0}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Delivery charges</span>
              <span className="text-green-600">FREE</span>
            </div>
            <div className="border-t border-gray-300 my-2"></div>
            <div className="flex justify-between font-semibold text-base">
              <span>Total Amount</span>
              <span>€{order.total || 0}</span>
            </div>
            <p className="mt-1 text-sm text-green-800 font-medium">
              Payment Status: {order.status}
            </p>
          </div>

          <div className="border-t border-gray-200"></div>

          {/* Seller Info */}
          <div>
            <h2 className="text-gray-800 font-semibold flex items-center gap-2 mb-1">
              <User className="h-5 w-5 text-purple-600 text-lg" /> Sold by
            </h2>
            <p className="text-gray-600 text-sm">
              {order.sellerId?.username || "N/A"}
            </p>
            <p className="text-gray-600 text-sm">
              {order.sellerId?.email || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
