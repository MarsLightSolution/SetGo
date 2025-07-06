// PaymentDialog.jsx
import React, { useState, useMemo } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------- Lottie URLs ---------------- */
const LOTTIES = {
  LOADING:
    "https://lottie.host/b929aa99-cfcf-4ce7-bdf5-61cad2c3f6f8/wL9y4hrffB.lottie",
  SUCCESS:
    "https://lottie.host/4d55262c-ea7c-48e2-9743-3d432f018cab/ziPzpGQKjj.lottie",
  FAILURE:
    "https://lottie.host/8eb74ef8-201e-44fc-a8a2-48f1737f298a/c0sZhMohd4.lottie",
};

/* Wrap every Lottie in the same fade / scale animation */
const LottieWrap = ({ type }) => (
  <motion.div
    key={type}
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.85 }}
    transition={{ duration: 0.35 }}
    className="flex justify-center w-full"
  >
    <DotLottieReact
      src={LOTTIES[type]}
      loop
      autoplay
      style={{ width: "100%", height: 280 }} // fills most of the dialog
    />
  </motion.div>
);

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */
const PaymentDialog = ({
  product,
  user,
  owner,
  onClose,
  onPaymentSuccess, // OPTIONAL callback → receives backend JSON on success
}) => {
  if (!product || !user || !owner) return null; // guard

  /* ---------------- State ---------------- */
  const [walletBalance, setWalletBalance] = useState(user.walletBalance ?? 0);
  const [useWallet, setUseWallet] = useState(false);
  const [onlineMethod, setOnlineMethod] = useState(""); // "UPI" | "CARD"
  const [status, setStatus] = useState("READY"); // READY | LOADING | SUCCESS | FAILURE

  /* ---------------- Derived amounts ---------------- */
  const price = product.price ?? 0;
  const walletDeduction = useWallet ? Math.min(walletBalance, price) : 0;
  const remainder = price - walletDeduction;

  /* ---------------- UI helper ---------------- */
  const Radio = ({ value, label }) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="onlineMethod"
        value={value}
        checked={onlineMethod === value}
        onChange={() => setOnlineMethod(value)}
        disabled={remainder === 0 || status !== "READY"}
      />
      <span>{label}</span>
    </label>
  );

  /* Pay / Retry button text */
  const payLabel = useMemo(() => {
    if (status === "LOADING") return "Processing…";
    if (status === "SUCCESS") return "Paid";
    if (status === "FAILURE") return "Retry Payment";
    if (remainder === 0) return `Pay ₹${price} with Wallet`;
    if (!onlineMethod) return "Select payment method";
    return `Pay ₹${remainder} via ${onlineMethod}`;
  }, [status, price, remainder, onlineMethod]);

  const isPayDisabled =
    status === "LOADING" ||
    (status === "READY" && remainder > 0 && !onlineMethod);

  /* ---------------- Main Pay / Retry handler ---------------- */
  const handlePay = async () => {
    /* Retry path */
    if (status === "FAILURE") {
      setStatus("READY");
      return;
    }
    if (isPayDisabled) return;

    /* Wallet‑only path */
    if (remainder === 0) {
      await walletTransferFlow();
    } else {
      // 👉 place your online‑gateway integration here
      console.log(
        `Would pay ₹${remainder} via ${onlineMethod} (wallet used ₹${walletDeduction})`
      );
    }
  };

  /* ---------------- Wallet transfer flow ---------------- */
  const walletTransferFlow = async () => {
    setStatus("LOADING");

    /* generate simple IDs */
    const orderId = `${Date.now()}`;
    const txnId = `txn_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    const payload = {
      senderId: user._id ?? user.id,
      receiverId: owner._id ?? owner.id,
      type: "transfer",
      amount: price,
      description: `Payment for order ${orderId}`,
      transactionId: txnId,
      referenceId: `order_${orderId}`,
      source: "purchase",
      // 🔒 DO NOT include 'status' – backend sets it
    };

    try {
      const res = await fetch(
        "http://localhost:8080/api/transaction/transferFund",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({})); // fallback if no JSON

      if (res.ok) {
        setWalletBalance((b) => b - price);
        setStatus("SUCCESS");
        /* Pass the backend response up if caller wants it */
        onPaymentSuccess?.(data);
        /* auto‑close after 1.8 s */
        setTimeout(onClose, 4800);
      } else {
        console.error("Transfer failed:", data);
        setStatus("FAILURE");
      }
    } catch (err) {
      console.error("Network error:", err);
      setStatus("FAILURE");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative">
        {/* Close icon */}
        <button
          onClick={onClose}
          disabled={status === "LOADING"}
          className="absolute top-3 right-3 text-xl text-gray-500 hover:text-red-600"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-4 text-center">Complete Payment</h2>

        {/* Order Summary */}
        <section className="border rounded p-4 mb-4">
          <p className="font-semibold">Order Summary</p>
          <div className="flex justify-between mt-2">
            <span>Product Price</span>
            <span className="font-bold text-green-600">₹{price}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Wallet Balance</span>
            <span
              className={`font-semibold ${
                walletBalance ? "text-green-600" : "text-red-500"
              }`}
            >
              ₹{walletBalance}
            </span>
          </div>
        </section>

        {/* Wallet toggle */}
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={useWallet}
            onChange={(e) => setUseWallet(e.target.checked)}
            disabled={!walletBalance || status !== "READY"}
          />
          <span>
            Use Wallet&nbsp;
            {walletBalance > 0 && `(up to ₹${walletBalance})`}
            {walletBalance === 0 && "– insufficient funds"}
          </span>
        </label>

        {/* Wallet info */}
        {useWallet && (
          <div
            className={`${
              walletDeduction
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            } text-sm p-3 rounded mb-4`}
          >
            {walletDeduction === price
              ? "Full amount will be paid from wallet."
              : `₹${walletDeduction} will be deducted from wallet. Remaining ₹${remainder} to be paid online.`}
          </div>
        )}

        {/* Online radios */}
        {remainder > 0 && (
          <>
            <p className="font-semibold mb-2">Choose Online Method</p>
            <div className="flex flex-col gap-2 mb-4">
              <Radio value="UPI" label="UPI" />
              <Radio value="CARD" label="Credit / Debit Card" />
            </div>
          </>
        )}

        {/* Lottie animation */}
        <AnimatePresence mode="wait">
          {status !== "READY" && (
            <div className="flex items-center justify-center mb-4">
              {status === "LOADING" && <LottieWrap type="LOADING" />}
              {status === "SUCCESS" && <LottieWrap type="SUCCESS" />}
              {status === "FAILURE" && <LottieWrap type="FAILURE" />}
            </div>
          )}
        </AnimatePresence>

        {/* Pay / Retry button (hidden after success) */}
        {status !== "SUCCESS" && (
          <button
            onClick={handlePay}
            disabled={isPayDisabled}
            className={`w-full ${
              isPayDisabled
                ? "bg-gray-300 cursor-not-allowed"
                : status === "FAILURE"
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-lime-500 hover:bg-lime-600"
            } text-white font-semibold py-2 rounded transition`}
          >
            {payLabel}
          </button>
        )}

        {/* Footer */}
        <div className="text-xs text-center text-gray-500 mt-4">
          100% Secured Payments&nbsp;|&nbsp;Verified Merchant&nbsp;|&nbsp;PCI DSS
          Certified
        </div>
      </div>
    </div>
  );
};

export default PaymentDialog;
