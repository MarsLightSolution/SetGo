import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentDialog from "../../pages/PaymentDialog";
import ShareModal from "../../components/Popups/ShareModal";
import { useTranslation } from "react-i18next";

import leftadImage from "../../assets/images/ad01.png";
import rightadImage from "../../assets/images/ad02.png";

const CheckoutPage = () => {
  const { t } = useTranslation();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [dialogUser, setDialogUser] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const product = state?.product;
  const user = state?.user;

  // Validate product exists
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-lg font-semibold text-gray-600 mb-4">
          ⚠️ No product found. Please go back and try again.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    address: user?.address || "",
    city: user?.city || "",
    postalCode: user?.postalCode || "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckout = async () => {
    // Validate form fields
    if (!form.fullName || !form.email || !form.address || !form.city || !form.postalCode) {
      alert("⚠️ Please fill in all the fields before proceeding.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      alert("⚠️ Please enter a valid email address.");
      return;
    }

    // Postal code validation (6 digits)
    if (form.postalCode.length !== 6) {
      alert("⚠️ Postal code must be 6 digits.");
      return;
    }

    const userId = user?._id;

    if (!userId) {
      alert("⚠️ Please log in to continue.");
      navigate("/login");
      return;
    }

    // Fetch latest user data (including wallet balance)
    // ✅ SECURITY: Backend will authenticate user via session/JWT
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER}/users/${userId}/wallet`, {
        credentials: "include", // ✅ SECURITY: Include cookies for authentication
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user data");
      }

      const json = await res.json();

      if (json?.data) {
        // Merge form data with fetched user data
        const dialogData = {
          ...json.data,
          fullName: form.fullName,
          email: form.email,
          address: form.address,
          city: form.city,
          postalCode: form.postalCode,
        };

        setDialogUser(dialogData);
        setShowPaymentDialog(true);
      } else {
        alert("❌ Failed to load user data. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      alert("❌ Error loading user data. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const tax = product.price * 0; // 0% tax
  const total = product.price + tax;

  const prevImage = () => {
    setCurrentImageIndex(
      currentImageIndex === 0 ? product.pictures.length - 1 : currentImageIndex - 1
    );
  };

  const nextImage = () => {
    setCurrentImageIndex(
      currentImageIndex === product.pictures.length - 1 ? 0 : currentImageIndex + 1
    );
  };

  const handlePaymentSuccess = (amount) => {
    console.log("✅ Payment successful:", amount);
    // You can add additional success handling here
  };

  return (
    <>
      <div className="h-screen bg-gray-50 pt-4">
        <div className="flex gap-6 justify-center px-4">
          {/* Left Ad */}
          <div className="hidden lg:block w-[160px] sticky top-[70px] h-[80vh] z-30">
            <img
              src={leftadImage}
              alt={t("home.leftAdAlt")}
              className="w-full h-[550px] object-cover rounded"
            />
          </div>

          {/* Main Checkout Section */}
          <div className="max-w-4xl w-full grid md:grid-cols-2 gap-6">
            {/* Product Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col">
              {/* Product Image Carousel */}
              <div className="relative w-full h-64 mb-6 rounded-xl overflow-hidden">
                {product?.pictures?.length > 0 ? (
                  <>
                    <img
                      src={`${import.meta.env.VITE_SERVER}/${product.pictures[currentImageIndex]}`}
                      alt={`Product image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover rounded-xl transition duration-300"
                    />
                    {product.pictures.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/60 text-gray-700 hover:bg-white/80 rounded-full p-2 shadow"
                        >
                          &#10094;
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/60 text-gray-700 hover:bg-white/80 rounded-full p-2 shadow"
                        >
                          &#10095;
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-2 py-1 rounded">
                          {currentImageIndex + 1} / {product.pictures.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <img
                    src={`${import.meta.env.VITE_SERVER}/uploads/placeholder.jpg`}
                    alt="Placeholder"
                    className="w-full h-full object-cover rounded-xl"
                  />
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {product.title?.en || product.name?.en || "Product"}
              </h2>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed text-m mb-4">
                {product.description?.en
                  ? product.description.en.length > 100
                    ? product.description.en.substring(0, 100) + "..."
                    : product.description.en
                  : "No description available"}
              </p>

              {/* Details */}
              <div className="space-y-1 text-gray-700 text-m mb-4">
                {product.condition && (
                  <p>
                    <span className="font-semibold">Condition:</span>{" "}
                    <span className="text-gray-800">{product.condition}</span>
                  </p>
                )}
                {product.name?.en && (
                  <p>
                    <span className="font-semibold">Seller:</span>{" "}
                    <span className="text-gray-800">{product.name.en}</span>
                  </p>
                )}
                {product.street && (
                  <p className="text-gray-500 text-s">{product.street}</p>
                )}
              </div>

              {/* Price + Share */}
              <div className="mt-auto flex items-center justify-between">
                <p className="text-2xl font-bold text-green-600">₼ {product.price.toFixed(2)}</p>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 font-semibold rounded-xl hover:bg-green-100 transition-shadow shadow-sm hover:shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14a3 3 0 010-4.242l4.243-4.243a3 3 0 014.242 4.243l-1.415 1.415M14 10a3 3 0 010 4.242l-4.243 4.243a3 3 0 01-4.242-4.243l1.415-1.415"
                    />
                  </svg>
                  Share
                </button>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                Checkout
              </h3>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name *"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                    required
                  />
                </div>

                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email *"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                    required
                  />
                </div>

                <div>
                  <input
                    type="text"
                    name="address"
                    placeholder="Street Address *"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                    required
                  />
                </div>

                <div>
                  <input
                    type="text"
                    name="city"
                    placeholder="City *"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                    required
                  />
                </div>

                <div>
                  <input
                    type="text"
                    name="postalCode"
                    placeholder="Postal Code (6 digits) *"
                    value={form.postalCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      handleChange({ target: { name: "postalCode", value } });
                    }}
                    maxLength={6}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                    required
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-6 border-t border-gray-300 pt-4 text-sm space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product Price:</span>
                  <span className="font-medium text-gray-800">
                    ₼ {product.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (0%):</span>
                  <span className="font-medium text-gray-800">₼ {tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-3 text-green-600 border-t pt-3">
                  <span>Total:</span>
                  <span>₼ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className={`w-3/4 mx-auto block mt-6 ${isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                  } text-white py-3 px-4 font-semibold rounded-lg shadow-md transition transform hover:scale-[1.02] disabled:transform-none disabled:hover:scale-100`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  "Place Order"
                )}
              </button>

              <p className="text-xs text-center text-gray-500 mt-3">
                * All fields are required
              </p>
            </div>
          </div>

          {/* Right Ad */}
          <div className="hidden lg:block w-[160px] sticky top-[90px] h-fit z-30">
            <img
              src={rightadImage}
              alt={t("home.rightAdAlt")}
              className="w-full h-[550px] object-cover rounded"
            />
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      {/* ✅ SECURITY: Only pass product._id, backend fetches owner from database */}
      {showPaymentDialog && dialogUser && product && (
        <PaymentDialog
          product={product}
          user={dialogUser}
          owner={product.owner || product.userId || product.sellerId}
          onClose={() => setShowPaymentDialog(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal product={product} onClose={() => setShowShareModal(false)} />
      )}
    </>
  );
};

export default CheckoutPage;