import React, { useEffect, useState } from "react";

const PaymentDialog = ({ onClose, product, user }) => {
  if (!product || !user) return null;

  const [walletBalance, setWalletBalance] = useState(user.walletBalance || 0);
  const [isPaid, setIsPaid] = useState(false);
  const productPrice = product.price || 0;
  const needsTopUp = walletBalance < productPrice;
  const remainingBalance = walletBalance - productPrice;

  const handlePayment = () => {
    if (needsTopUp) {
      alert("Please add money to wallet before proceeding.");
      return;
    }
    setWalletBalance(remainingBalance); // simulate deduction
    setIsPaid(true);
    alert("Payment successful. Thank you!");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative">
        <button className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-xl" onClick={onClose}>
          &times;
        </button>

        <h2 className="text-xl font-bold mb-2 text-center">Confirm Your Payment</h2>
        <div className="text-sm text-center text-green-700 font-medium mb-4">Extra Discount on UPI Payments</div>

        {/* Order Summary */}
        <div className="border rounded p-4 mb-4">
          <p className="text-gray-700 font-semibold">Order Summary</p>
          <div className="flex justify-between mt-2">
            <span>Product Price</span>
            <span className="text-green-600 font-bold">₹{productPrice}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Wallet Balance</span>
            <span className={needsTopUp ? "text-red-500 font-semibold" : "text-green-600 font-semibold"}>
              ₹{walletBalance}
            </span>
          </div>
          {needsTopUp && (
            <div className="mt-2 text-sm text-red-600 font-medium">
              Insufficient balance. Please <button className="underline">add amount</button>.
            </div>
          )}
        </div>

        {/* Delivery Info */}
        <div className="border rounded p-4 mb-2 text-sm">
          <p className="text-gray-700 font-semibold mb-1">Deliver To</p>
          <p className="text-gray-600">{user.profileName || user.username}</p>
          <p className="text-gray-600">{user.deliveryAddress || "Not Provided"}</p>
          <p className="text-gray-600">{user.email}</p>
          <p className="text-gray-600">{user.phoneNumber || "No phone number"}</p>
        </div>

        {/* Deduction Reason (only after payment) */}
        {isPaid && (
          <div className="text-green-600 text-sm mb-4">
            ₹{productPrice} was deducted from your wallet for purchasing "{product.title}".
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          className={`w-full ${
            needsTopUp ? "bg-gray-300 cursor-not-allowed" : "bg-lime-500 hover:bg-lime-600"
          } text-white font-semibold py-2 rounded`}
          disabled={needsTopUp || isPaid}
        >
          {isPaid ? `Paid ₹${productPrice}` : `Proceed to Pay ₹${productPrice}`}
        </button>

        <div className="text-xs text-center text-gray-500 mt-4">
          100% Secured Payments | Verified Merchant | PCI DSS Certified
        </div>
      </div>
    </div>
  );
};

export default PaymentDialog;
