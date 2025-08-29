import React, { useState, useEffect, useMemo } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const LOTTIES = {
  LOADING: "https://lottie.host/b929aa99-cfcf-4ce7-bdf5-61cad2c3f6f8/wL9y4hrffB.lottie",
  SUCCESS: "https://lottie.host/4d55262c-ea7c-48e2-9743-3d432f018cab/ziPzpGQKjj.lottie",
  FAILURE: "https://lottie.host/8eb74ef8-201e-44fc-a8a2-48f1737f298a/c0sZhMohd4.lottie",
};
const orderTimestamp = Date.now().toString();

const LottieWrap = ({ type }) => (
  <motion.div
    key={type}
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.85 }}
    transition={{ duration: 0.35 }}
    className="flex justify-center w-full"
  >
    <DotLottieReact src={LOTTIES[type]} loop autoplay style={{ width: "100%", height: 280 }} />
  </motion.div>
);

const PaymentDialogboast = ({ product, user, owner, onClose, onPaymentSuccess }) => {
  if (!product || !user || !owner) return null;

  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [onlineMethod, setOnlineMethod] = useState("");
  const [status, setStatus] = useState("READY");
  const [orderId, setOrderId] = useState(null); // For socket subscription
  const navigate = useNavigate();
  const price = 100 ?? 0;
  const walletDeduction = useWallet ? Math.min(walletBalance, price) : 0;
  const remainder = price - walletDeduction;
  const txnId = `txn_${orderTimestamp}_${Math.floor(Math.random() * 1e6)}`;

  useEffect(() => {
    setWalletBalance(user.walletBalance ?? 0);
  }, [user]);

  useEffect(() => {
    if (!orderId) return;

    const socket = io(`${import.meta.env.VITE_SERVER}`, { withCredentials: true });
    socket.emit("subscribePayment", orderId);

    socket.on("paymentUpdate", (data) => {
      if (data.status === "PAID" && data.orderId === orderId) {
        setStatus("SUCCESS");
        onPaymentSuccess?.(price);
        setTimeout(() => {
          socket.disconnect();
          onClose();
        }, 1800);
      }
    });

    return () => {
      socket.off("paymentUpdate");
      socket.disconnect();
    };
  }, [orderId, onClose, onPaymentSuccess, price]);

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

  const payLabel = useMemo(() => {
    if (status === "LOADING") return "Processing…";
    if (status === "SUCCESS") return "Paid";
    if (status === "FAILURE") return "Retry Payment";
    if (remainder === 0) return `Pay ₼ ${price} with Wallet`;
    if (!onlineMethod) return "Select payment method";
    return `Pay ₼ ${remainder} via ${onlineMethod}`;
  }, [status, price, remainder, onlineMethod]);

  const isPayDisabled = status === "LOADING" || (status === "READY" && remainder > 0 && !onlineMethod);

  const handlePay = async () => {
    if (status === "FAILURE") {
      setStatus("READY");
      return;
    }
    if (isPayDisabled) return;

    if (remainder === 0) {
      await walletTransfer();
    } else {
      await onlineTransfer();
    }
  };

  const walletTransfer = async () => {
    setStatus("LOADING");
    const payload = {
      senderId: user._id,
      receiverId: owner,
      type: "transfer",
      amount: price,
      description: `Payment for order ${orderTimestamp}`,
      transactionId: txnId,
      referenceId: `order_${orderTimestamp}`,
      source: "wallet",
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER}/api/transaction/transferFund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus("SUCCESS");
        onPaymentSuccess?.(price);
        setTimeout(onClose, 1800);
      } else {
        setStatus("FAILURE");
      }
    } catch (err) {
      console.error(err);
      setStatus("FAILURE");
    }
  };

  const onlineTransfer = async () => {
    setStatus("LOADING");
    const orderTimestamp = Date.now().toString();
    const txnId = `txn_${orderTimestamp}_${Math.floor(Math.random() * 1e6)}`;

    const payload = {
      userId: user._id,
      receiverId: owner,
      type: "transfer",
      amount: price,
      description: `Payment for order ${orderTimestamp}`,
      transactionId: txnId,
      referenceId: `order_${orderTimestamp}`,
      source: "online",
      product: product._id,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER}/api/payment/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (data.success === true) {
        setOrderId(data.orderId);
        window.location.href = data.url;
      } else {
        setStatus("FAILURE");
      }
    } catch (err) {
      console.error(err);
      setStatus("FAILURE");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white max-w-md w-full rounded-xl shadow-lg p-6 relative">
        <button
          className="absolute top-3 right-3 text-xl text-gray-500 hover:text-red-600"
          disabled={status === "LOADING"}
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4 text-center">Complete Payment</h2>
        <section className="border rounded p-4 mb-4">
          <p className="font-semibold">Order Summary</p>
          <div className="flex justify-between mt-2">
            <span>Boost Ad</span>
            <span className="font-bold text-green-600">₼ {price}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Wallet Balance</span>
            <span className={`font-semibold ${walletBalance ? "text-green-600" : "text-red-500"}`}>
              ₼ {walletBalance}
            </span>
          </div>
        </section>
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={useWallet}
            onChange={(e) => setUseWallet(e.target.checked)}
            disabled={!walletBalance || status !== "READY"}
          />
          <span>Use Wallet {walletBalance > 0 && `(up to ₼ ${walletBalance})`}</span>
        </label>
        {useWallet && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded mb-4">
            {remainder === 0
              ? "Full amount will be paid from wallet."
              : `₼ ${walletDeduction} will be deducted from wallet. Remaining ₼ ${remainder} to pay online.`}
          </div>
        )}
        {remainder > 0 && (
          <>
            <p className="font-semibold mb-2">Choose Online Method</p>
            <div className="flex flex-col gap-2 mb-4">
              <Radio value="CARD" label="Credit / Debit Card" />
            </div>
          </>
        )}
        <AnimatePresence mode="wait">
          {status !== "READY" && (
            <div className="flex items-center justify-center mb-4">
              <LottieWrap type={status} />
            </div>
          )}
        </AnimatePresence>
        {status !== "SUCCESS" && (
          <button
            disabled={isPayDisabled}
            onClick={handlePay}
            className={`w-full ${isPayDisabled
                ? "bg-gray-300 cursor-not-allowed"
                : status === "FAILURE"
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-lime-500 hover:bg-lime-600"
              } text-white font-semibold py-2 rounded`}
          >
            {payLabel}
          </button>
        )}
        <div className="text-xs text-center text-gray-500 mt-4">
          100% Secured Payments | Verified Merchant | PCI DSS Certified
        </div>
      </div>
    </div>
  );
  
};
export default PaymentDialogboast;
