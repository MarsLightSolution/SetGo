import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
        const { data } = await axios.get(`http://localhost:8080/Orders/user/${userId}`);
        if (data.success) setOrders(data.data);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchOrders();
  }, [userId]);

  if (loading) return <div className="text-center mt-10">Loading orders...</div>;
  if (!orders.length) return <div className="text-center mt-10">No orders found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="grid gap-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="border rounded-lg shadow hover:shadow-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center bg-white"
          >
            <div className="flex-1 mb-4 md:mb-0">
              <div className="text-lg font-semibold text-gray-800">
                {order.productId?.title?.[i18n.language] || "Unnamed Product"}
              </div>
              <div className="mt-1 text-gray-600">
                <span className="font-medium">Price: </span>₹{order.productId?.price || 0}
              </div>
              <div className="mt-1">
                <span className="font-medium">Status: </span>
                <span
                  className={`px-2 py-1 rounded text-white text-sm ${
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
            <Link
              to={`/order/${order._id}`}
              className="inline-block text-white bg-blue-600 hover:bg-blue-700 font-medium px-4 py-2 rounded transition-colors duration-300"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
