import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function SmsVerify({ phoneNumber,email }) {
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
        email:email,
        phoneNumber,
        code: code,
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
        email:email,
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
    <div className="flex flex-col space-y-4">
      <h1 className="text-lg font-semibold text-gray-900 text-center leading-snug">
        SMS verification code has been sent to you
      </h1>

      <div className="border-t border-gray-200" />

      <div className="text-center text-sm">
        <span className="text-green-600 font-medium cursor-pointer hover:underline">
          Change
        </span>
        <span className="text-gray-700 ml-1">code sent to {phoneNumber}</span>
      </div>

      <div className="space-y-1">
        <input
          type="text"
          placeholder="Your Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-gray-600 text-xs">
          Please enter the verification code you received here
        </p>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        {message && <p className="text-green-600 text-xs">{message}</p>}
      </div>

      <div className="text-center text-sm">
        <span className="text-gray-700">Didn't receive the code? </span>
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-green-600 font-medium hover:underline"
        >
          {resending ? "Resending..." : "Resend"}
        </button>
      </div>

      <div className="flex justify-end gap-4 pt-2">
        <button
          onClick={() => console.log("Help clicked")}
          className="px-8 py-3 text-sm font-semibold text-green-800 border border-green-800 rounded-full hover:bg-green-800 hover:text-white transition"
        >
          Help
        </button>
        <button
          onClick={handleVerify}
          disabled={loading || !code}
          className="px-8 py-3 text-sm font-semibold text-white bg-lime-500 rounded-full hover:bg-lime-600 transition"
        >
          {loading ? "Verifying..." : "Ready"}
        </button>
      </div>
    </div>
  );
}

export default SmsVerify;
