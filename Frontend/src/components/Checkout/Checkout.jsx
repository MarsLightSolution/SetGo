import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentDialog from "../../pages/PaymentDialog";
import ShareModal from "../../components/Popups/ShareModal";
import { useTranslation } from "react-i18next";

import leftadImage from "../../assets/images/ad01.png";
import rightadImage from "../../assets/images/ad02.png";
import SafeImage from "../common/SafeImage";

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
          {t("checkout.noProductFound")}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
        >
          {t("checkout.goBack")}
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
      alert(t("checkout.fillAllFields"));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      alert(t("checkout.invalidEmail"));
      return;
    }

    // Postal code validation (6 digits)
    if (form.postalCode.length !== 6) {
      alert(t("checkout.postalCodeInvalid"));
      return;
    }

    const userId = user?._id;

    if (!userId) {
      alert(t("checkout.pleaseLogIn"));
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
        throw new Error(t("checkout.fetchUserDataFailed"));
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
        alert(t("checkout.loadUserDataFailed"));
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      alert(t("checkout.errorLoadingUserData"));
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
                    <SafeImage
                      src={`${import.meta.env.VITE_SERVER}/${product.pictures[currentImageIndex]}`}
                      alt={t("checkout.productImageAlt", { index: currentImageIndex + 1 })}
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
                  <SafeImage
                    src={`${import.meta.env.VITE_SERVER}/uploads/placeholder.jpg`}
                    alt={t("checkout.placeholderAlt")}
                    className="w-full h-full object-cover rounded-xl"
                  />
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-800 mb-2 line-clamp-2 break-words">
                {product.title?.en || product.name?.en || t("checkout.product")}
              </h2>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed text-m mb-4 line-clamp-3 break-words">
                {product.description?.en || t("checkout.noDescription")}
              </p>

              {/* Details */}
              <div className="space-y-1 text-gray-700 text-m mb-4">
                {product.condition && (
                  <p>
                    <span className="font-semibold">{t("checkout.condition")}:</span>{" "}
                    <span className="text-gray-800">{product.condition}</span>
                  </p>
                )}
                {product.name?.en && (
                  <p>
                    <span className="font-semibold">{t("checkout.seller")}:</span>{" "}
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
                  {t("checkout.share")}
                </button>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                {t("checkout.checkout")}
              </h3>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="fullName"
                    placeholder={t("checkout.fullNamePlaceholder")}
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
                    placeholder={t("checkout.emailPlaceholder")}
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
                    placeholder={t("checkout.addressPlaceholder")}
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
                    placeholder={t("checkout.cityPlaceholder")}
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
                    placeholder={t("checkout.postalCodePlaceholder")}
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
                  <span className="text-gray-600">{t("checkout.productPrice")}:</span>
                  <span className="font-medium text-gray-800">
                    ₼ {product.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("checkout.tax")}:</span>
                  <span className="font-medium text-gray-800">₼ {tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-3 text-green-600 border-t pt-3">
                  <span>{t("checkout.total")}:</span>
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
                    {t("checkout.loading")}
                  </span>
                ) : (
                  t("checkout.placeOrder")
                )}
              </button>

              <p className="text-xs text-center text-gray-500 mt-3">
                {t("checkout.allFieldsRequired")}
              </p>

              {/* Accepted Cards & Security Note */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-center gap-3 mb-3">
                  {/* Visa Logo */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 500" className="h-7 w-auto">
                    <rect width="780" height="500" rx="40" fill="#1a1f71" />
                    <path d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8zM540.7 157.2c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.6-90.2 64.7-.3 28.2 26.6 43.9 46.9 53.3 20.8 9.6 27.8 15.8 27.7 24.4-.1 13.2-16.6 19.2-32 19.2-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.2 0 92.6-26.3 93-66.8.2-22.3-14-39.2-44.8-53.2-18.6-9.1-30.1-15.1-30-24.3 0-8.1 9.7-16.8 30.6-16.8 17.5-.3 30.1 3.5 40 7.5l4.8 2.3 7.3-42.8zM676.2 152.9h-41.3c-12.8 0-22.4 3.5-28 16.3l-79.4 179.5h56.2s9.2-24.2 11.3-29.5h68.6c1.6 6.9 6.5 29.5 6.5 29.5h49.7l-43.6-195.8zm-65.9 126.3c4.4-11.3 21.4-54.8 21.4-54.8-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47 12.4 56.6h-44.5zM259.3 152.9l-52.3 133.5-5.6-27.2c-9.7-31.2-39.9-65-73.7-81.9l47.9 171.1 56.6-.1 84.2-195.4h-57.1z" fill="#fff" />
                    <path d="M146.9 152.9H59.6l-.7 4c67.1 16.2 111.5 55.4 129.9 102.5l-18.7-90.2c-3.2-12.4-12.8-15.9-23.2-16.3z" fill="#f9a533" />
                  </svg>
                  {/* Mastercard Logo */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 500" className="h-7 w-auto">
                    <rect width="780" height="500" rx="40" fill="#16366f" />
                    <circle cx="330" cy="250" r="150" fill="#d9222a" />
                    <circle cx="450" cy="250" r="150" fill="#ee9f2d" />
                    <path d="M390 130.7c-35.3 27.5-58 70.4-58 118.3s22.7 90.8 58 118.3c35.3-27.5 58-70.4 58-118.3s-22.7-90.8-58-118.3z" fill="#eb6100" />
                  </svg>
                </div>
                <p className="text-xs text-center text-gray-500 leading-relaxed">
                  {t("checkout.cardPaymentDisclaimer")}
                </p>
              </div>
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
