"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Truck, CheckCircle, Clock, XCircle, Calendar, MapPin, Star, ArrowRight } from "lucide-react";
import axios from "axios";
import { useTranslation } from "react-i18next";

const MyOrders = () => {
  const { i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_SERVER}/Orders/user/${userId}`);
        if(data.success){
        setOrders(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchOrders();
  }, [userId]);
  // const getStatusIcon = (status) => {
  //   switch (status) {
  //     case "PAID":
  //     case "DELIVERED":
  //       return <CheckCircle className="h-4 w-4" />;
  //     case "SHIPPED":
  //       return <Truck className="h-4 w-4" />;
  //     case "PENDING":
  //       return <Clock className="h-4 w-4" />;
  //     case "CANCELLED":
  //       return <XCircle className="h-4 w-4" />;
  //     default:
  //       return <Package className="h-4 w-4" />;
  //   }
  // };
  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No orders found</h2>
          <p className="text-gray-500 mb-6">
            You haven't placed any orders yet. Start shopping to see your orders here.
          </p>
          <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10">
  <div className="w-full max-w-4xl bg-white rounded-lg shadow p-8">
    {/* Header */}
    <div className="border-b border-gray-300 pb-4 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">My Orders</h1>
          <p className="text-gray-500 mt-2">Track and manage your orders</p>
        </div>
        <div className="text-m text-gray-500">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </div>
      </div>
    </div>

    {/* Orders List */}
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order._id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
          {/* Order Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b  border-gray-300 pb-4 mb-4">
            <div>
              <p className="text-sm font-medium text-gray-800">Order ID: #{order._id}</p>
              <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Placed on {formatDate(order.createdAt || order.orderDate)}</span>
              </div>
            </div>
            <div
  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold text-sm ${getStatusColor(order.status)}`}
>
  {/* Show icon only if status is not PAID */}
  {order.status !== "PAID" && (order.status)}
  {/* <span>{order.status}</span> */}
</div>

          </div>

          {/* Product Info */}
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="flex gap-4 flex-1">
              <div className="flex-shrink-0">
                <img
                  src={order.productId?.image || "/placeholder.svg"}
                  alt={order.productId?.title?.[i18n.language] || "Product"}
                  className="w-36 h-36 object-cover rounded border"
                />
              </div>
              <div className="flex-1 min-w-0 ">
                <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2 ">
                  {order.productId?.title?.[i18n.language] || "Unnamed Product"}
                </h3>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-xl font-bold text-green-700">
                    ₼ {order.productId?.price?.toLocaleString() || 0}
                  </span>
                  {/* <span className="text-sm text-gray-500">Qty: {order.quantity || 1}</span> */}
                </div>
                {order.deliveryAddress && (
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span className="line-clamp-2">{order.deliveryAddress}</span>
                  </div>
                )}
              </div>
            </div>

  {/* Actions */}
<div className="lg:w-48 flex flex-col gap-2 mt-4 lg:mt-0">
  {/* View Details */}
  <Link
    to={`/order/${order._id}`}
    className="bg-green-600 text-white flex items-center justify-center gap-1 px-3 py-2 rounded hover:bg-green-700 transition"
  >
    View Details <ArrowRight className="h-4 w-4" />
  </Link>

  {/* Report Button */}
  <button className="text-red-600 text-base px-2 py-1 rounded hover:underline transition w-full cursor-pointer">
    Report
  </button>
</div>


  {/* Other buttons (commented out) */}
  {/* {order.status === "PAID" && (
    <button className="border border-gray-300 text-gray-700 flex items-center justify-center gap-1 px-3 py-2 rounded hover:bg-gray-100 transition">
      <Star className="h-4 w-4" /> Rate & Review
    </button>
  )} */}

  {/* {(order.status === "SHIPPED" || order.status === "PENDING") && (
    <button className="border border-gray-300 text-gray-700 flex items-center justify-center gap-1 px-3 py-2 rounded hover:bg-gray-100 transition">
      <Truck className="h-4 w-4" /> Track Order
    </button>
  )} */}
</div>

          </div>
        
      ))}
    </div>
  </div>
</div>

  );
};

export default MyOrders;
