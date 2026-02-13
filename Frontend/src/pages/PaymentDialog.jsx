import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Simple CSS-based status indicators (no external dependencies)
const StatusIndicator = ({ status }) => {
  const { t } = useTranslation();
  if (status === "LOADING") {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-lime-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-lime-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">{t("payment.processingPayment")}</p>
      </div>
    );
  }

  if (status === "SUCCESS") {
    return (
      <div className="flex flex-col items-center justify-center py-8 animate-fadeIn">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-4 text-green-600 font-semibold">{t("payment.paymentSuccessful")}</p>
      </div>
    );
  }

  if (status === "FAILURE") {
    return (
      <div className="flex flex-col items-center justify-center py-8 animate-fadeIn">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="mt-4 text-red-600 font-semibold">{t("payment.paymentFailed")}</p>
      </div>
    );
  }

  return null;
};

const PaymentDialog = ({
  product,
  user,
  onClose,
  onPaymentSuccess
}) => {
  const { t } = useTranslation();
  if (!product || !user) return null;

  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [customAmount, setCustomAmount] = useState(""); // Custom wallet amount
  const [status, setStatus] = useState("READY");
  const [errorMessage, setErrorMessage] = useState("");
  const [authToken, setAuthToken] = useState(null);
  const [userId, setUserId] = useState(null);

  const navigate = useNavigate();
  const price = product.price ?? 0;

  // Authenticate user and get userId from localStorage
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const storedUserId = localStorage.getItem("userId");

    // if (!accessToken || !storedUserId) {
    //   setErrorMessage("Authentication required. Please log in again.");
    //   setStatus("FAILURE");
    //   // Optionally redirect to login
    //   setTimeout(() => {
    //     navigate("/login");
    //   }, 2000);
    //   return;
    // }

    setAuthToken(accessToken);
    setUserId(storedUserId);
  }, [navigate]);

  useEffect(() => {
    setWalletBalance(user.walletBalance ?? 0);
  }, [user]);

  // Calculate actual wallet amount to use
  const walletAmountToUse = useMemo(() => {
    if (!useWallet) return 0;

    if (customAmount === "") {
      // Use maximum possible (either full balance or price, whichever is lower)
      return Math.min(walletBalance, price);
    }

    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) return 0;

    // Ensure amount doesn't exceed wallet balance or price
    return Math.min(amount, walletBalance, price);
  }, [useWallet, customAmount, walletBalance, price]);

  // Calculate remaining amount to pay online
  const remainingAmount = useMemo(() => {
    return Math.max(0, price - walletAmountToUse);
  }, [price, walletAmountToUse]);

  const payLabel = useMemo(() => {
    if (status === "LOADING") return t("payment.processingPaymentLabel");
    if (status === "SUCCESS") return t("payment.paymentSuccessfulLabel");
    if (status === "FAILURE") return t("payment.retryPayment");
    return t("payment.payAmount", { amount: price });
  }, [status, price, t]);

  const isPayDisabled = status === "LOADING";

  const handlePay = async () => {
    if (status === "FAILURE") {
      setStatus("READY");
      setErrorMessage("");
      return;
    }
    if (isPayDisabled) return;

    await processPayment();
  };

  // Handler for custom amount input
  const handleCustomAmountChange = (e) => {
    const value = e.target.value;

    // Allow empty string or valid numbers
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomAmount(value);
    }
  };

  // Quick select buttons for wallet amount
  const handleQuickSelect = (percentage) => {
    const maxUsable = Math.min(walletBalance, price);
    const amount = (maxUsable * percentage).toFixed(2);
    setCustomAmount(amount);
  };

  /**
   * ✅ SECURE: Unified payment processing
   * Backend will:
   * - Authenticate user via JWT token from localStorage
   * - Fetch product details from database (including owner)
   * - Validate product price
   * - Calculate wallet deduction
   * - Process payment
   * - Create order
   */
  const processPayment = async () => {
    // Check authentication before processing
    // if (!authToken || !userId) {
    //   setStatus("FAILURE");
    //   setErrorMessage("Authentication required. Please log in again.");
    //   setTimeout(() => {
    //     navigate("/login");
    //   }, 2000);
    //   return;
    // }

    setStatus("LOADING");
    setErrorMessage("");

    // ✅ SECURITY: Minimal payload with userId from localStorage
    const payload = {
      buyerId: userId,  // From localStorage (backend still validates token)
      productId: product._id,  // Backend fetches full product details
      walletUsed: useWallet,
      walletAmount: walletAmountToUse, // Specific amount to use from wallet
      checkoutDetails: {
        // Shipping address from frontend (user input)
          name: user.fullName,
          email: user.email,
          city: user.city,
          address: user.address,
          pincode: user.postalCode,
        
      },
    };
    console.log(payload);
    
   try {
    const res = await fetch(
      `${import.meta.env.VITE_SERVER}/api/payments/initiate`,
      {
        method: "POST",
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload),
      }
    );
      // console.log(res);
      

      const data = await res.json().catch(() => ({}));

      // Handle unauthorized/authentication errors
      if (res.status === 401 || res.status === 403) {
        setStatus("FAILURE");
        setErrorMessage(t("payment.sessionExpired"));
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userId");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }
      console.log(data.data);
      
      console.log(data.completed);
      

      if (data.success === true) {
        // If payment completed without redirect (wallet-only payment)
        if (data.completed === true) {
          console.log("Payment completed successfully");
          setStatus("SUCCESS");

          // Notify parent component
          onPaymentSuccess?.(price);

          // Navigate to order page
          setTimeout(() => {
            if (data.orderId) {
              navigate(`/order/${data.orderId}`);
            } else {
              onClose();
            }
          }, 2300);
        }
        // If payment requires redirect (online payment or wallet + online)
        else if (data.url) {
          // Store minimal info in localStorage before redirect
          localStorage.setItem('pendingPayment', JSON.stringify({
            orderId: data.orderId,
            transactionId: data.transactionId,
            timestamp: Date.now(),
          }));

          // Redirect to payment gateway
          window.location.href = data.url;
        } else {
          setStatus("FAILURE");
          setErrorMessage(t("payment.invalidResponse"));
        }
      } else {
        setStatus("FAILURE");
        setErrorMessage(
          data.message || t("payment.paymentFailedRetry")
        );
      }
    } catch (err) {
      console.error("Payment error:", err);
      setStatus("FAILURE");
      setErrorMessage(t("payment.networkError"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-md w-full rounded-xl shadow-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-3 right-3 text-xl text-gray-500 hover:text-red-600 transition-colors"
          disabled={status === "LOADING"}
          onClick={onClose}
          aria-label={t("payment.closeDialog")}
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-4 text-center">{t("payment.completePayment")}</h2>

        {/* Order Summary */}
        <section className="border rounded-lg p-4 mb-4 bg-gray-50">
          <p className="font-semibold mb-3 text-gray-700">{t("payment.orderSummary")}</p>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">{t("payment.productPrice")}</span>
            <span className="font-bold text-green-600 text-lg">₼ {price}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t">
            <span className="text-gray-600">{t("payment.walletBalance")}</span>
            <span
              className={`font-semibold ${walletBalance > 0 ? "text-green-600" : "text-red-500"
                }`}
            >
              ₼ {walletBalance}
            </span>
          </div>

          {/* Payment Breakdown */}
          {useWallet && walletAmountToUse > 0 && (
            <>
              <div className="flex justify-between items-center py-2 border-t text-sm">
                <span className="text-gray-600">{t("payment.walletPayment")}</span>
                <span className="font-semibold text-lime-600">
                  - ₼ {walletAmountToUse.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-t">
                <span className="text-gray-700 font-medium">{t("payment.onlinePayment")}</span>
                <span className="font-bold text-blue-600 text-lg">
                  ₼ {remainingAmount.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </section>

        {/* Wallet Checkbox */}
        {walletBalance > 0 && (
          <div className="mb-4">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={useWallet}
                onChange={(e) => {
                  setUseWallet(e.target.checked);
                  if (!e.target.checked) {
                    setCustomAmount(""); // Reset custom amount when unchecked
                  }
                }}
                disabled={status !== "READY"}
                className="w-4 h-4 text-lime-500"
              />
              <span className="text-gray-700 font-medium">
                {t("payment.useWalletBalance")}
              </span>
            </label>

            {/* Custom Amount Input */}
            {useWallet && (
              <div className="mt-3 p-4 bg-gradient-to-r from-lime-50 to-green-50 rounded-lg border border-lime-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("payment.enterWalletAmount")}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    ₼
                  </span>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    placeholder={t("payment.maxAmountPlaceholder", { amount: Math.min(walletBalance, price).toFixed(2) })}
                    disabled={status !== "READY"}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Quick Select Buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(0.25)}
                    disabled={status !== "READY"}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-lime-700 bg-white border border-lime-300 rounded hover:bg-lime-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(0.5)}
                    disabled={status !== "READY"}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-lime-700 bg-white border border-lime-300 rounded hover:bg-lime-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(0.75)}
                    disabled={status !== "READY"}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-lime-700 bg-white border border-lime-300 rounded hover:bg-lime-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(1)}
                    disabled={status !== "READY"}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-lime-700 bg-white border border-lime-300 rounded hover:bg-lime-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t("payment.max")}
                  </button>
                </div>

                {/* Validation Message */}
                {customAmount && parseFloat(customAmount) > Math.min(walletBalance, price) && (
                  <p className="text-xs text-red-600 mt-2">
                    {t("payment.amountExceedsBalance")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Wallet Usage Info */}
        {useWallet && walletAmountToUse > 0 && (
          <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg mb-4 border border-blue-200">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p>
                {walletAmountToUse >= price
                  ? t("payment.fullWalletPayment", { amount: walletAmountToUse.toFixed(2) })
                  : t("payment.partialWalletPayment", { walletAmount: walletAmountToUse.toFixed(2), remainingAmount: remainingAmount.toFixed(2) })}
              </p>
            </div>
          </div>
        )}

        {/* Payment Method Info */}
        {(!useWallet || remainingAmount > 0) && (
          <div className="bg-gradient-to-r from-lime-50 to-green-50 rounded-lg p-4 mb-4 border border-lime-200">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <svg className="w-6 h-6 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-800">{t("payment.securePayment")}</p>
                <p className="text-xs text-gray-600">
                  {t("payment.poweredByAzericard")}
                </p>
              </div>
            </div>
            {/* Accepted Card Logos */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-lime-200">
              <span className="text-xs text-gray-500">{t("payment.weAccept")}</span>
              {/* Visa Logo */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 500" className="h-5 w-auto">
                <rect width="780" height="500" rx="40" fill="#1a1f71" />
                <path d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8zM540.7 157.2c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.6-90.2 64.7-.3 28.2 26.6 43.9 46.9 53.3 20.8 9.6 27.8 15.8 27.7 24.4-.1 13.2-16.6 19.2-32 19.2-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.2 0 92.6-26.3 93-66.8.2-22.3-14-39.2-44.8-53.2-18.6-9.1-30.1-15.1-30-24.3 0-8.1 9.7-16.8 30.6-16.8 17.5-.3 30.1 3.5 40 7.5l4.8 2.3 7.3-42.8zM676.2 152.9h-41.3c-12.8 0-22.4 3.5-28 16.3l-79.4 179.5h56.2s9.2-24.2 11.3-29.5h68.6c1.6 6.9 6.5 29.5 6.5 29.5h49.7l-43.6-195.8zm-65.9 126.3c4.4-11.3 21.4-54.8 21.4-54.8-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47 12.4 56.6h-44.5zM259.3 152.9l-52.3 133.5-5.6-27.2c-9.7-31.2-39.9-65-73.7-81.9l47.9 171.1 56.6-.1 84.2-195.4h-57.1z" fill="#fff" />
                <path d="M146.9 152.9H59.6l-.7 4c67.1 16.2 111.5 55.4 129.9 102.5l-18.7-90.2c-3.2-12.4-12.8-15.9-23.2-16.3z" fill="#f9a533" />
              </svg>
              {/* Mastercard Logo */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 500" className="h-5 w-auto">
                <rect width="780" height="500" rx="40" fill="#16366f" />
                <circle cx="330" cy="250" r="150" fill="#d9222a" />
                <circle cx="450" cy="250" r="150" fill="#ee9f2d" />
                <path d="M390 130.7c-35.3 27.5-58 70.4-58 118.3s22.7 90.8 58 118.3c35.3-27.5 58-70.4 58-118.3s-22.7-90.8-58-118.3z" fill="#eb6100" />
              </svg>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        {status !== "READY" && (
          <StatusIndicator status={status} />
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 border border-red-200">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Pay Button */}
        {status !== "SUCCESS" && (
          <button
            disabled={isPayDisabled}
            onClick={handlePay}
            className={`w-full ${isPayDisabled
                ? "bg-gray-300 cursor-not-allowed"
                : status === "FAILURE"
                  ? "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
                  : "bg-lime-500 hover:bg-lime-600 active:bg-lime-700"
              } text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg transform active:scale-[0.98]`}
          >
            {payLabel}
          </button>
        )}

        {/* Security Badge & Disclaimer */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>{t("payment.securedPaymentBadge")}</span>
          </div>
          <p className="text-[11px] text-center text-gray-400 leading-relaxed">
            {t("payment.cardPaymentDisclaimer")}
          </p>
        </div>

        {/* Add required CSS for animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default PaymentDialog;