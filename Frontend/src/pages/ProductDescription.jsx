import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LocationOn, CalendarToday } from "@mui/icons-material";
import PaymentDialog from "./PaymentDialog";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("accessToken");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [userdata, setUserData] = useState(null); // 👈 new
  const fetchProductById = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/products/product/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
      const result = await res.json();
      setProduct(result.data);
      setOwner(result.data._id);
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };
const [user, setUser] = useState(null);
const [owner,setOwner] = useState(null);
useEffect(() => {
  const storedUser = localStorage.getItem("userData");
  if (storedUser) {
    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error("Error parsing user data", e);
    }
  }
}, []);

  useEffect(() => {
    fetchProductById();
  }, [id]);

  if (loading)
    return <div className="text-center text-gray-600 mt-10">Loading...</div>;
  if (!product)
    return (
      <div className="text-center text-red-500 mt-10">Product not found</div>
    );

  return (
    <>
      <div className="max-w-5xl mx-auto bg-white shadow-md mt-10 p-6 rounded-md">
        {/* Image */}
        <div className="w-full h-[300px] flex justify-center mb-6">
          <img
            src={`http://localhost:8080/${
              product.pictures?.[0]?.replace(/\\/g, "/") ||
              "uploads/placeholder.jpg"
            }`}
            alt={product.title}
            className="object-contain h-full rounded-md"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          {product.title}
        </h1>

        {/* Price */}
        <p className="text-green-600 font-bold text-xl mb-2">
          € {product.price?.toLocaleString("de-DE")}{" "}
          <span className="text-sm font-medium">VB</span>
        </p>

        {/* Location and Date */}
        <div className="flex items-center gap-4 text-gray-600 text-sm mb-4">
          <div className="flex items-center gap-1">
            <LocationOn fontSize="small" />
            {product.location?.postalCode || "Unknown"} – Oranienburg
          </div>
          <div className="flex items-center gap-1">
            <CalendarToday fontSize="small" />
            {new Date().toLocaleDateString("de-DE")}
          </div>
        </div>

        {/* Description */}
        <div className="text-gray-700 leading-relaxed mt-4 whitespace-pre-line">
          {product.description || "Keine Beschreibung verfügbar."}
        </div>
        <button
          className="bg-green-600 hover:bg-purple-50 rounded-lg text-white transition duration-300 ease-linear mt-5 border-2 border-green-600 font-semibold hover:text-green-700 p-3 px-10 tracking-wider uppercase"
          onClick={() => {
           if (user) {
      setShowPaymentDialog(true);
    } else {
      alert("User not loaded yet");
    }
  }}
        >
          Buy Now
        </button>
      </div>
 {showPaymentDialog && (
  <PaymentDialog
    onClose={() => setShowPaymentDialog(false)}
    product={product}
    user={user} // ✅ FIXED: Now dialog receives `user`
    owner={owner}

  />
)}
    </>
  );
};

export default ProductDetail;
