import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

const OrderDetail = () => {
  const { id } = useParams();
  const { i18n } = useTranslation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`http://localhost:8080/Orders/${id}`);
        if (data.success) {
          setOrder(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading)
    return (
      <div className="text-center mt-10 text-gray-600">Loading order details...</div>
    );
  if (!order)
    return (
      <div className="text-center mt-10 text-gray-600">Order not found.</div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Order Detail</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Product Info</h2>
        <div className="mt-1 text-gray-600">
          <div className="mb-1">
            <span className="font-medium">Title:</span>{" "}
            {order.productId?.title?.[i18n.language] || "N/A"}
          </div>
          <div className="mb-1">
            <span className="font-medium">Description:</span>{" "}
            {order.productId?.description?.[i18n.language] || "N/A"}
          </div>
          <div>
            <span className="font-medium">Price:</span> ₹{order.productId?.price || 0}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Seller Info</h2>
        <div className="mt-1 text-gray-600">
          <div className="mb-1">
            <span className="font-medium">Name:</span> {order.sellerId?.name || "N/A"}
          </div>
          <div>
            <span className="font-medium">Email:</span> {order.sellerId?.email || "N/A"}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-700">Order Status</h2>
        <div className="mt-2">
          <span
            className={`px-3 py-1 rounded text-white font-medium ${
              order.status === "PAID"
                ? "bg-green-600"
                : order.status === "PENDING"
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
