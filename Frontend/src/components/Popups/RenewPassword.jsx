import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Footer from "../common/Footer"; // Assuming this path is correct
import {
  ToastifyContainer,
  showSuccessToast,
  showErrorToast,
} from "../../Hooks/Tostify"; // Assuming this path is correct
import { Mail } from "lucide-react";

// i18n import
import { useTranslation } from 'react-i18next';

function RenewPassword() {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSend = async () => {
    if (!email) {
      showErrorToast(t("renewPassword.emailRequired")); // Translated
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8080/forgotpassword", {
        email,
      });

      if (res.status === 200 || res.status === 201) {
        showSuccessToast(t("renewPassword.resetLinkSentSuccess")); // Translated
        setTimeout(() => {
          navigate("/emailnotify", { state: { email } });
        }, 1000);
      } else {
        showErrorToast(t("renewPassword.failedToSendResetEmail")); // Translated
      }
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        t("renewPassword.serverError"); // Translated fallback
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastifyContainer />

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-white">
        {/* Main Content */}
        <div className="flex-grow flex items-start justify-center pt-10 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
            <div className="mb-6 text-center">
              <Mail className="mx-auto h-10 w-10 text-green-500 mb-2" />
              <h1 className="text-2xl font-bold text-gray-800">
                {t("renewPassword.title")} {/* Translated */}
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                {t("renewPassword.instructions")} {/* Translated */}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("renewPassword.emailLabel")} {/* Translated */}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder={t("renewPassword.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSend}
                disabled={loading}
                className={`w-48 mx-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition duration-200 flex items-center justify-center ${
                  loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {loading && (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                )}
                {loading ? t("renewPassword.sending") : t("renewPassword.sendResetLink")} {/* Translated */}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}

export default RenewPassword;