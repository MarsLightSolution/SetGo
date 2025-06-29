import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { LocationOn, CalendarToday } from "@mui/icons-material";

const ProductDetail = () => {
  const { id } = useParams(); // Get product ID from URL
  const { wishlist } = useSelector((state) => state.wishlist);

  // Find product by ID from wishlist or product list (mock here)
  const product = wishlist.find((item) => item._id === id);

  if (!product) {
    return <div className="text-center text-gray-600 mt-10">Product not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto bg-white shadow-md mt-10 p-6 rounded-md">
      {/* Image */}
      <div className="w-full h-[300px] flex justify-center mb-6">
        <img
          src={`http://localhost:8080/${product.pictures?.[0]?.replace(/\\/g, "/") || "uploads/placeholder.jpg"}`}
          alt={product.title}
          className="object-contain h-full rounded-md"
        />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">{product.title}</h1>

      {/* Price */}
      <p className="text-green-600 font-bold text-xl mb-2">
        € {product.price?.toLocaleString("de-DE")} <span className="text-sm font-medium">VB</span>
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
      <div className="text-gray-700 leading-relaxed mt-4">
        {product.description || "Keine Beschreibung verfügbar."}
      </div>
    </div>
  );
};

export default ProductDetail;
