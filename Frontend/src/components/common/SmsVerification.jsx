import React, { useState } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function SmsVerification({ phoneNumber, email, onClose, showCloseButton = false, onSuccess }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const verifyOTP = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/verify-otp",
        {
          phoneNumber: phoneNumber,
          otp: otp,
          email: email,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/login");
        }
      } else {
        setError(response.data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setError(
        error.response?.data?.message ||
        "An error occurred while verifying OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/send-otp",
        {
          phoneNumber: phoneNumber,
          email: email,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        alert("OTP sent successfully!");
      } else {
        setError(response.data.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      setError(
        error.response?.data?.message ||
        "An error occurred while resending OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
      {showCloseButton && onClose && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      )}

      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        SMS Verification
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        We've sent a verification code to <strong>{phoneNumber}</strong>
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter OTP
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            maxLength="6"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-center text-lg tracking-widest"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <button
          onClick={verifyOTP}
          disabled={loading}
          className="w-full bg-lime-500 text-white py-2 px-4 rounded-md hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <div className="text-center">
          <button
            onClick={resendOTP}
            disabled={loading}
            className="text-sm text-lime-600 hover:text-lime-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Didn't receive the code? Resend OTP
          </button>
        </div>
      </div>
    </div>
  );
}

export default SmsVerification;