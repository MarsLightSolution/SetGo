import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// i18n import
import { useTranslation } from 'react-i18next';

function PhoneVerification({ onSendOTP, setPhoneNumber, email }) {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const [selectedCountry, setSelectedCountry] = useState(t("phoneVerification.countryGermany")); // Initialize with translated default
  const [localPhoneNumber, setLocalPhoneNumber] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Use translation keys for countries
  const countryKeys = [
    "phoneVerification.countryGermany",
    "phoneVerification.countryIndia",
    "phoneVerification.countryUnitedStates",
    "phoneVerification.countryUnitedKingdom",
    "phoneVerification.countryFrance",
    "phoneVerification.countrySpain",
    "phoneVerification.countryItaly",
    "phoneVerification.countryNetherlands",
    "phoneVerification.countryBelgium",
    "phoneVerification.countryAustria",
    "phoneVerification.countrySwitzerland",
  ];

  const handleCountrySelect = (countryKey) => { // Now accepts a key
    setSelectedCountry(t(countryKey)); // Set state with translated value
    setIsDropdownOpen(false);
  };

  const handleSendOTP = async () => {
    setLoading(true);
    setError("");

    // Extract country code from the selected translated string
    // Example: "Germany +49" -> "+49"
    const countryCode = selectedCountry.split(" ").pop(); // Gets the last part, which should be "+XX"
    const fullNumber = `${countryCode}${localPhoneNumber}`;

    try {
      const res = await axios.post("http://localhost:8080/send-otp", {
        email: email,
        phoneNumber: fullNumber,
      });

      console.log(res.data);
      setPhoneNumber(fullNumber);
      onSendOTP();
    } catch (err) {
      console.error(err);
      setError(t("phoneVerification.sendOTPFailed")); // Translated error message
    } finally {
      setLoading(false);
    }
  };

  const handleHelp = () => {
    navigate("/login"); // This button navigates to login, so translate its label as "Login"
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Heading */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">
          {t("phoneVerification.title")} {/* Translated */}
        </h1>
        <div className="w-full h-px bg-gray-300 mb-3"></div>
      </div>

      {/* Instructions */}
      <p className="text-sm text-gray-700">
        {t("phoneVerification.instructions")} {/* Translated */}
      </p>

      {/* Input fields */}
      <div className="flex gap-3">
        {/* Country dropdown */}
        <div className="relative w-1/2">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md cursor-pointer"
          >
            <span className="truncate">{selectedCountry}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-md max-h-40 overflow-y-auto text-sm">
              {countryKeys.map((key) => ( // Iterate over keys
                <button
                  key={country}
                  onClick={() => handleCountrySelect(country)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer"
                >
                  {t(key)} {/* Display translated country */}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone number input */}
        <input
          type="tel"
          value={localPhoneNumber}
          onChange={(e) => setLocalPhoneNumber(e.target.value)}
          placeholder="Phone number"
          className="w-1/2 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-lime-500 cursor-pointer"
        />
      </div>

      {/* Error */}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Disclaimer */}
      <p className="text-sm text-gray-600">
        {t("phoneVerification.disclaimer")} {/* Translated */}
      </p>

      {/* Buttons */}
      <div className="flex justify-end gap-4 pt-3">
        <button
          onClick={handleHelp}
          className="px-6 py-2 text-sm font-semibold text-green-800 border border-green-800 rounded-full hover:bg-green-800 hover:text-white transition cursor-pointer"
        >
          {t("login.loginButton")} {/* Reusing login button translation */}
        </button>
        <button
          onClick={handleSendOTP}
          disabled={loading || !localPhoneNumber}
          className="px-6 py-2 text-sm font-semibold text-white bg-lime-500 rounded-full hover:bg-lime-600 transition"
        >
          {loading ? t("phoneVerification.sending") : t("phoneVerification.confirm")} {/* Translated */}
        </button>
      </div>
    </div>
  );
}

export default PhoneVerification;