import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { CheckCircle, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";

// ✅ Base API URL
const API_URL = "http://localhost:8080/Orders"; // change to your backend URL

export default function SellerAdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [trackingInputs, setTrackingInputs] = useState({});
  const { i18n } = useTranslation();

  const sellerId = localStorage.getItem("userId"); // 🔑 get sellerId from local storage

  // Fetch seller orders
  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/seller/${sellerId}`);
      console.log("Fetched orders:", res.data.orders);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]); // prevent map crash
    }
  };

  // Upload tracking ID
  const handleUploadTracking = async (id) => {
    const trackingId = trackingInputs[id];
    if (!trackingId) return alert("Enter a tracking ID");

    try {
      await axios.patch(`${API_URL}/${id}/tracking`, { trackingId });
      await fetchOrders(); // refresh orders
      alert(`Tracking ID uploaded for Order #${id}`);
    } catch (err) {
      console.error("Error uploading tracking ID:", err);
      alert("Failed to upload tracking ID");
    }
  };

  // Helper: pick correct translation
  const getLocalizedName = (nameObj) => {
    if (!nameObj) return "N/A";
    if (typeof nameObj === "string") return nameObj;
    return (
      nameObj[i18n.language] || nameObj["en"] || Object.values(nameObj)[0] || "N/A"
    );
  };

  useEffect(() => {
    if (sellerId) fetchOrders();
  }, [sellerId]);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.isArray(orders) && orders.length > 0 ? (
        orders.map((order) => (
          <motion.div
            key={order._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white shadow-md rounded-2xl p-4 space-y-3">
              <h2 className="text-xl font-semibold">Order #{order._id}</h2>

              <p>
                <b>Product:</b> {getLocalizedName(order.productId?.name)}
              </p>
              <p>
                <b>Buyer:</b> {getLocalizedName(order.buyerId?.name)}
              </p>
              <p>
                <b>Amount:</b> ${order.total}
              </p>
              <p>
                <b>Status:</b> {order.status}
              </p>

              {/* Upload Tracking ID for Seller */}
              {order.status === "paid" && (
                <div className="flex items-center space-x-2">
                  <input
                    className="border rounded-md px-2 py-1 flex-1"
                    placeholder="Enter Tracking ID"
                    value={trackingInputs[order._id] || ""}
                    onChange={(e) =>
                      setTrackingInputs({
                        ...trackingInputs,
                        [order._id]: e.target.value,
                      })
                    }
                  />
                  <button
                    onClick={() => handleUploadTracking(order._id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-md flex items-center"
                  >
                    <Truck className="mr-2 h-4 w-4" /> Upload
                  </button>
                </div>
              )}

              {/* Show Tracking ID if available */}
              {order.trackingId && (
                <p>
                  <b>Tracking ID:</b> {order.trackingId}
                </p>
              )}

              {order.status === "completed" && (
                <div className="text-green-700 flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4" /> Payment Released
                </div>
              )}
            </div>
          </motion.div>
        ))
      ) : (
        <p>No orders found</p>
      )}
    </div>
  );
}
