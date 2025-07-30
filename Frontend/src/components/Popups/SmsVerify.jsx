import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import { useTranslation } from 'react-i18next';

function SmsVerify({ phoneNumber, email, onClose }) {
  const { t } = useTranslation();
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
      setError(t("smsVerify.verificationFailed"));
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
      setMessage(t("smsVerify.otpSentMessage"));
    } catch (err) {
      console.error("Resend failed:", err.response?.data || err.message);
      setError(t("smsVerify.resendFailed"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="relative bg-white w-full max-w-md rounded-xl p-5 shadow-lg space-y-5">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-center text-gray-900">
          {t("smsVerify.title")}
        </h2>

        <p className="text-sm text-center text-gray-600">
          {t("smsVerify.codeSentTo")}{" "}
          <span className="font-medium text-gray-800">{phoneNumber}</span>
        </p>

        <div className="space-y-1">
          <input
            type="text"
            placeholder={t("smsVerify.inputPlaceholder")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-600">{t("smsVerify.codeLengthInfo")}</p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          {message && <p className="text-xs text-green-600">{message}</p>}
        </div>

        <div className="text-center text-sm text-gray-700">
          {t("smsVerify.didNotReceiveCode")}{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-green-600 font-medium hover:underline"
          >
            {resending ? t("smsVerify.resending") : t("smsVerify.resend")}
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-green-800 border border-green-800 rounded-full hover:bg-green-800 hover:text-white transition"
          >
            {t("smsVerify.cancelButton")}
          </button>
          <button
            onClick={handleVerify}
            disabled={loading || !code}
            className="px-5 py-2 text-sm font-medium text-white bg-lime-500 rounded-full hover:bg-lime-600 transition disabled:opacity-50"
          >
            {loading ? t("smsVerify.verifying") : t("smsVerify.verifyButton")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SmsVerify;