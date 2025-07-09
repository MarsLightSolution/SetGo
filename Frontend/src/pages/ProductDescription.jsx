// ProductDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LocationOn, CalendarToday } from "@mui/icons-material";
import PaymentDialog from "./PaymentDialog";

const ProductDetail = () => {
  const { id } = useParams();
  const token = localStorage.getItem("accessToken");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dialogUser, setDialogUser] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing userData:", e);
      }
    }
  }, []);

  const fetchProductById = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/products/product/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      });
      const result = await res.json();
      setProduct(result.data);
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductById();
  }, [id]);

  const handleBuyNow = async () => {
    const userId = user?._id;
    const ownerId = product?.user?._id || product?.owner;
    if (!userId || !ownerId) {
      alert("User or owner not loaded yet.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:8080/users/get-users/${userId}`);
      const json = await res.json();
      if (json?.data) {
        setDialogUser(json.data);
        setShowPaymentDialog(true);
      } else {
        alert("Failed to load user data.");
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      alert("Error loading user data.");
    }
  };

  const ownerId = product?.user?._id || product?.owner || null;

  if (loading) return <div className="text-center mt-10">Loading…</div>;
  if (!product) return <div className="text-center text-red-500 mt-10">Product not found</div>;

  return (
    <>
      <div className="max-w-5xl mx-auto bg-white shadow-md mt-10 p-6 rounded-md">
        <div className="w-full h-[300px] flex justify-center mb-6">
          <img
            src={`http://localhost:8080/${product.pictures?.[0]?.replace(/\\/g, "/") || "uploads/placeholder.jpg"}`}
            alt={product.title}
            className="object-contain h-full rounded-md"
          />
        </div>

        <h1 className="text-2xl font-semibold text-gray-800 mb-2">{product.title}</h1>
        <p className="text-green-600 font-bold text-xl mb-2">
          ₹ {product.price?.toLocaleString("en-IN")}
        </p>

        <div className="flex items-center gap-4 text-gray-600 text-sm mb-4">
          <div className="flex items-center gap-1">
            <LocationOn fontSize="small" />
            {product.location?.postalCode || "Unknown"} – Oranienburg
          </div>
          <div className="flex items-center gap-1">
            <CalendarToday fontSize="small" />
            {new Date().toLocaleDateString("en-IN")}
          </div>
        </div>

        <div className="text-gray-700 leading-relaxed mt-4 whitespace-pre-line">
          {product.description || "No description available."}
        </div>

        <button
          className="bg-green-600 hover:bg-purple-50 rounded-lg text-white transition duration-300 ease-linear mt-5 border-2 border-green-600 font-semibold hover:text-green-700 p-3 px-10 tracking-wider uppercase"
          onClick={handleBuyNow}
        >
          Buy Now
        </button>
      </div>

      {showPaymentDialog && dialogUser && (
        <PaymentDialog
          onClose={() => setShowPaymentDialog(false)}
          product={product}
          user={dialogUser}
          owner={ownerId}
          onPaymentSuccess={() => {
            console.log("Payment success");
          }}
        />
      )}
    </>
  );
};

export default ProductDetail;