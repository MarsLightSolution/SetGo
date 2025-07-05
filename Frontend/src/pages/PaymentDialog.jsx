import React from "react";

const PaymentDialog = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
<div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-xl"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-2 text-center">Confirm Your Payment</h2>

        <div className="text-sm text-center text-green-700 font-medium mb-4">
          Extra Discount on UPI Payments
        </div>

        {/* Order Summary */}
        <div className="border rounded p-4 mb-4">
          <p className="text-gray-700 font-semibold">Order Summary</p>
          <div className="flex justify-between mt-2">
            <span>Original Price</span>
            <span className="line-through text-gray-500">₹4,248</span>
          </div>
          <div className="flex justify-between">
            <span>Discounted Price</span>
            <span className="text-green-600 font-semibold">₹2,946</span>
          </div>
          <div className="text-sm text-center text-green-600 mt-2">
            You saved ₹499.00 🎉
          </div>
        </div>

        {/* Address Info */}
        <div className="border rounded p-4 mb-4 text-sm">
          <p className="text-gray-700 font-semibold mb-1">Deliver To</p>
          <p className="text-gray-600">Shreyansh Sahu</p>
          <p className="text-gray-600">Bd-41, Bd Block, Street No. 125, Action Area 1b, Newtown, Kolkata</p>
          <p className="text-gray-600">Prabhat Chs, 3rd Floor, 24 Paraganas North, WB - 700156</p>
          <p className="text-gray-600 mt-1">shreyanshsahu1410@gmail.com</p>
        </div>

        {/* Payment Options */}
        <div className="border rounded p-4 mb-4">
          <p className="text-gray-700 font-semibold mb-2">Payment Options</p>
          <p className="text-xs text-gray-500 mb-3">Additional discount upto ₹20 on UPI</p>

          <ul className="space-y-2 text-sm">
            <li className="flex justify-between items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
              <div>
                <span className="bg-green-200 text-green-700 text-xs px-2 py-0.5 rounded mr-2">Get ₹20 Off</span>
                UPI
              </div>
              <span className="text-green-700 font-semibold">₹2,926</span>
            </li>
            <li className="flex justify-between items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
              <div>
                <span className="font-semibold">0% EMI on UPI & Cards</span>
                <p className="text-xs text-gray-500">₹982 now + 2 EMIs via Snapmint</p>
              </div>
              <span className="text-green-700 font-semibold">₹2,946</span>
            </li>
            <li className="flex justify-between items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
              <span>Debit/Credit Cards</span>
              <span className="text-green-700 font-semibold">₹2,946</span>
            </li>
            <li className="flex justify-between items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
              <span>Netbanking</span>
              <span className="text-green-700 font-semibold">₹2,946</span>
            </li>
            <li className="flex justify-between items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
              <div>
                <span className="bg-green-200 text-green-700 text-xs px-2 py-0.5 rounded mr-2">Get cashback</span>
                Wallets
              </div>
              <span className="text-green-700 font-semibold">₹2,946</span>
            </li>
            <li className="flex justify-between items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
              <span>EMI</span>
              <span className="text-green-700 font-semibold">₹2,946</span>
            </li>
            <li className="flex justify-between items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
              <div>
                <span className="bg-red-200 text-red-700 text-xs px-2 py-0.5 rounded mr-2">₹100 COD fee added</span>
                Cash on Delivery
              </div>
              <span className="text-red-600 font-semibold">₹3,046</span>
            </li>
          </ul>
        </div>

        {/* Secure info */}
        <div className="text-xs text-center text-gray-500">
          100% Secured Payments | Verified Merchant | PCI DSS Certified
        </div>
      </div>
    </div>
  );
};

export default PaymentDialog;
