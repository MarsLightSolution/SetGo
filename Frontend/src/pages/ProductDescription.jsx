import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarToday, LocationOn } from "@mui/icons-material";
import PaymentDialog from "./PaymentDialog";
import leftadImage from "../assets/images/ad01.png";
import rightadImage from "../assets/images/ad02.png";
import Footer from "../components/common/Footer";

const ProductDetail = () => {
  const { id } = useParams();
  const token = localStorage.getItem("accessToken");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dialogUser, setDialogUser] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    if (product?.category) {
      fetchRelatedProducts(product.category);
    }
  }, [product]);

  const fetchRelatedProducts = async (category) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/products/category/${category}`
      );
      const json = await res.json();
      const filtered = json.data?.filter((p) => p._id !== id).slice(0, 3);
      setRelatedProducts(filtered || []);
    } catch (err) {
      console.error("Failed to fetch related products", err);
    }
  };

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
      const res = await fetch(
        `http://localhost:8080/users/get-users/${userId}`
      );
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
  if (!product)
    return (
      <div className="text-center text-red-500 mt-10">Product not found</div>
    );

  return (
    <>
      <div className="min-h-screen bg-white-100 pt-3">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-screen-xl px-4 flex flex-wrap gap-4 items-start">
            {/* Left Ad */}
            <div className="hidden lg:block w-[160px] sticky top-[90px] h-fit z-30">
              <img
                src={leftadImage}
                alt="Left Ad"
                className="w-full h-[550px] object-cover rounded"
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
               {/* Product Info */}
              <div className="md:col-span-2">
        <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
          <img
            src={`http://localhost:8080/${
              product.pictures?.[0]?.replace(/\\/g, "/") ||
              "uploads/placeholder.jpg"
            }`}
            alt={product.title}
            className="w-full h-[240px] object-contain rounded-lg"
          />

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {product.title || "Product Title"}
            </h1>
            <p className="text-green-700 text-xl font-semibold">
              {product.price?.toLocaleString("de-DE")} €{" "}
              <span className="text-sm">VB</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center text-sm text-gray-600 gap-x-4 gap-y-1">
            <div className="flex items-center gap-1">
              <LocationOn fontSize="small" />
              {product.location?.postalCode || "Unknown"} – Oranienburg
            </div>
            <div className="flex items-center gap-1">
              <CalendarToday fontSize="small" />
              16.06.2025
            </div>
            <div className="flex items-center gap-1">👁️ 7</div>
          </div>

          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
            {product.description || "Keine Beschreibung verfügbar."}
          </div>

          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded font-medium transition"
            onClick={handleBuyNow}
          >
            Buy Now
          </button>
        </div>
      </div>

                {/* Seller Info */}
                <div className="bg-white rounded-md shadow p-5 h-fit border border-gray-100 space-y-4">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md flex items-center justify-center gap-2 cursor-pointer">
              Send Message
            </button>

            <button className="w-full border text-sm font-medium text-green-600 border-green-500 hover:bg-green-50 py-2 rounded-md cursor-pointer">
              Add to Watchlist
            </button>

            <button className="w-full border text-sm text-gray-700 hover:bg-gray-100 py-2 rounded-md cursor-pointer">
              Share Listing
            </button>

            <div className="flex items-center gap-3">
            <div className="bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center text-white text-lg font-bold">
              {product.user?.name?.charAt(0) ||
                product.name?.charAt(0) ||
                "U"}
            </div>
            <div>
              <p className="font-semibold text-base text-gray-900">  {/* ← changed from text-sm to text-base */}
                {product.user?.name || product.name || "Unknown Seller"}
              </p>
              <p className="text-sm text-gray-500">Private User</p>
              <p className="text-sm text-gray-500">Active since 16.06.2025</p>
            </div>
          </div>

            <button className="w-full border border-green-600 text-green-700 font-medium py-1.5 rounded-md hover:bg-green-50 cursor-pointer">
              ➕ Follow
            </button>
          </div>
              </div>

              {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="w-full flex justify-center mt-10">
              <div className="w-full max-w-screen-xl px-4 mb-10">
                <h2 className="text-xl font-semibold mb-6">
                  This might also interest you
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {relatedProducts.map((item) => (
                    <div
                      key={item._id}
                      onClick={() =>
                        (window.location.href = `/products/product/${item._id}`)
                      }
                     className="flex gap-5 bg-white shadow p-4 rounded-md hover:bg-gray-50 cursor-pointer transition-transform transform hover:-translate-y-1 hover:shadow-lg duration-300 min-h-[130px] min-w-[860px]"

                    >
                      <img
                        src={`http://localhost:8080/${
                          item.pictures?.[0]?.replace(/\\/g, "/") ||
                          "uploads/placeholder.jpg"
                        }`}
                        alt={item.title}
                        className="w-36 h-28 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex flex-col justify-between flex-1">
                        <div className="text-sm text-gray-500 flex items-center justify-between">
                          <span>
                            📍 {item.location?.postalCode || "Unknown"} Oranienburg
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-800 mt-1 mb-1 line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm font-semibold text-green-700">
                          <span>₹ {item.price?.toLocaleString("en-IN")}</span>
                          {/* <span className="text-gray-500">
                            {item.area || "—"} m²
                          </span>
                          <span className="text-gray-500">
                            {item.rooms || "—"} rooms
                          </span> */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

            </div>

            {/* Right Ad */}
            <div className="hidden lg:block w-[160px] sticky top-[90px] h-fit z-30">
              <img
                src={rightadImage}
                alt="Right Ad"
                className="w-full h-[550px] object-cover rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
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
      <Footer/>
    </>
  );
};

export default ProductDetail;
