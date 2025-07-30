import React, { useState } from "react";
import Footer from "../components/common/Footer";
import { useNavigate } from "react-router-dom";
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  ToastifyContainer,
} from "../Hooks/Tostify";
import { Eye, EyeOff } from "lucide-react";

// i18n import
import { useTranslation } from 'react-i18next';

const Register = () => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateFields = () => {
    const { username, email, password } = formData;

    const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!username || !email || !password) {
      showWarningToast(t("register.allFieldsRequired")); // Translated
      return false;
    }

    if (!usernameRegex.test(username)) {
      showWarningToast(
        t("register.usernameValidation") // Translated
      );
      return false;
    }

    if (!emailRegex.test(email)) {
      showWarningToast(t("register.emailValidation")); // Translated
      return false;
    }

    if (password.length < 6) {
      showWarningToast(t("register.passwordValidation")); // Translated
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateFields()) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.status === 200 || res.status === 201) {
        showSuccessToast(t("register.successMessage")); // Translated
        setTimeout(() => navigate("/confirm"), 1500);
      } else {
        showErrorToast(data?.error || data?.message || t("register.failedMessage")); // Translated fallback
      }
    } catch (error) {
      console.error("Error:", error);
      showErrorToast(t("register.serverError")); // Translated
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastifyContainer />

      <div className="py-8 flex items-center text-black justify-center bg-[#f5f3f0]">
        <div className="w-full max-w-md bg-white px-6 py-8 rounded-md text-center">
          <h2 className="text-lg text-black font-semibold mb-4">
            {t("register.title")} {/* Translated */}
          </h2>
          <hr className="mb-6 border-t text-black border-gray-300" />

          <div className="text-left mb-4">
            <p className="font-semibold mb-2">{t("register.loginDetails")}</p> {/* Translated */}

            <input
              type="text"
              name="username"
              placeholder={t("register.usernamePlaceholder")} // Translated
              value={formData.username}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <input
              type="email"
              name="email"
              placeholder={t("register.emailPlaceholder")} // Translated
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={t("register.passwordPlaceholder")} // Translated
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span
                className="absolute right-3 top-2/5 transform -translate-y-1/2 cursor-pointer text-gray-500"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </span>
            </div>

            <label className="flex items-start text-sm mt-1">
              <input type="checkbox" className="mr-2 mt-1" />
              <span>
                {t("register.emailUpdatesCheckbox", { // Translated with interpolation for link
                  link: <span className="text-green-700 cursor-pointer">{t("register.unsubscribe")}</span>
                })}
              </span>
            </label>
          </div>

          <button
            onClick={handleRegister}
            className="hover:bg-[#B5E941] bg-lime-500 text-white font-semibold py-2 px-4 rounded-full w-full mt-4 transition-all flex items-center justify-center gap-2 cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                {t("register.registering")} {/* Translated */}
              </>
            ) : (
              t("register.registerButton") // Translated
            )}
          </button>

          <p className="text-xs text-gray-600 mt-4">
            {t("register.termsText1", { // Translated with interpolation for links
              termsLink: <span className="text-green-700">{t("register.termsOfUse")}</span>
            })}
            {t("register.termsText2", {
              privacyLink: <span className="text-green-700">{t("register.privacyPolicy")}</span>
            })}
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Register;