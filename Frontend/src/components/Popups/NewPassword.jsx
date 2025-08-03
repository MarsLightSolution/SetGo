import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "../../Hooks/Tostify";
import Footer from "../common/Footer"; // Assuming this path is correct

// i18n import
import { useTranslation } from 'react-i18next';

function NewPassword() {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      return showErrorToast(t("newPassword.allFieldsRequired")); // Translated
    }

    if (newPassword !== confirmPassword) {
      return showErrorToast(t("newPassword.passwordsDoNotMatch")); // Translated
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `http://localhost:8080/resetpassword?token=${token}`,
        { newPassword }
      );

      if (res.status === 200) {
        showSuccessToast(t("newPassword.resetSuccess")); // Translated
        setTimeout(() => navigate("/login"), 2000);
      } else {
        showErrorToast(t("newPassword.resetFailed")); // Translated
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        t("newPassword.serverError"); // Translated fallback
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br flex flex-col items-center from-green-50 to-white min-h-screen py-12">
      <ToastifyContainer />

      <div className="w-full max-w-lg bg-white p-8 shadow-xl rounded-2xl">
        <h1 className="text-3xl font-semibold text-gray-800 mb-4 text-center">
          {t("newPassword.title")} {/* Translated */}
        </h1>
        <p className="text-sm text-gray-500 mb-8 text-center">
          {t("newPassword.instructions")} {/* Translated */}
        </p>

        <div className="space-y-6">
          {/* New Password Field */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("newPassword.newPasswordLabel")} {/* Translated */}
            </label>
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder={t("newPassword.newPasswordPlaceholder")}
            />
            <span
              className="absolute top-9 right-3 text-gray-500 cursor-pointer"
              onClick={() => setShowNew((prev) => !prev)}
            >
              {showNew ? <Eye size={20} /> : <EyeOff size={20} />}
            </span>
          </div>

          {/* Confirm Password Field */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("newPassword.confirmPasswordLabel")} {/* Translated */}
            </label>
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder={t("newPassword.confirmPasswordPlaceholder")}
            />
            <span
              className="absolute top-9 right-3 text-gray-500 cursor-pointer"
              onClick={() => setShowConfirm((prev) => !prev)}
            >
              {showConfirm ? <Eye size={20} /> : <EyeOff size={20} />}
            </span>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-48 bg-green-600 hover:bg-green-700 text-white cursor-pointer font-semibold py-2 rounded-lg transition duration-200 flex items-center justify-center gap-2 mx-auto"
          >
            {loading && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                viewBox="0 0 24 24"
              >
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
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                />
              </svg>
            )}
            {loading ? t("newPassword.savingPassword") : t("newPassword.savePasswordButton")} {/* Translated */}
          </button>
        </div>
      </div>
      <div className="w-full py-4">
        <Footer />
      </div>
    </div>
  );
}

export default NewPassword;