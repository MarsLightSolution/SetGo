import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

function SmsVerify({ phoneNumber, email, onClose }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post("http://localhost:8080/verify-otp", {
        email,
        phoneNumber,
        code,
      });

      console.log("Verification successful:", res.data);
      navigate("/login");
    } catch (err) {
      console.error("OTP verification failed:", err.response?.data || err.message);
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post("http://localhost:8080/send-otp", {
        email,
        phoneNumber,
      });

      console.log("OTP resent:", res.data);
      setMessage("A new OTP has been sent.");
    } catch (err) {
      console.error("Resend failed:", err.response?.data || err.message);
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="relative bg-white w-full max-w-md rounded-xl p-5 shadow-lg space-y-5">
        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h2 className="text-lg font-semibold text-center text-gray-900">
          Verify your phone number
        </h2>

        <p className="text-sm text-center text-gray-600">
          A code has been sent to <span className="font-medium text-gray-800">{phoneNumber}</span>
        </p>

        {/* OTP Input */}
        <div className="space-y-1">
          <input
            type="text"
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-600">Enter the 6-digit code you received.</p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          {message && <p className="text-xs text-green-600">{message}</p>}
        </div>

        {/* Resend */}
        <div className="text-center text-sm text-gray-700">
          Didn’t receive the code?{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-green-600 font-medium hover:underline"
          >
            {resending ? "Resending..." : "Resend"}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-green-800 border border-green-800 rounded-full hover:bg-green-800 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={loading || !code}
            className="px-5 py-2 text-sm font-medium text-white bg-lime-500 rounded-full hover:bg-lime-600 transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SmsVerify;
