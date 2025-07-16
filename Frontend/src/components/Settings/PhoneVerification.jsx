import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import axios from "axios";

function PhoneVerification({ onSendOTP, setPhoneNumber, email, onClose }) {
  const [selectedCountry, setSelectedCountry] = useState("Germany +49");
  const [localPhoneNumber, setLocalPhoneNumber] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const countries = [
    "Germany +49",
    "India +91",
    "United States +1",
    "United Kingdom +44",
    "France +33",
    "Spain +34",
    "Italy +39",
    "Netherlands +31",
    "Belgium +32",
    "Austria +43",
    "Switzerland +41",
  ];

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
  };

  const handleSendOTP = async () => {
    setLoading(true);
    setError("");

    const countryCode = selectedCountry.split(" ")[1]; // e.g. +49
    const fullNumber = `${countryCode}${localPhoneNumber}`;

    try {
      const res = await axios.post("http://localhost:8080/send-otp", {
        email,
        phoneNumber: fullNumber,
      });

      setPhoneNumber(fullNumber);
      onSendOTP(); // Proceed to SMS verification
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-white w-full max-w-xl mx-auto px-6 py-8 rounded-xl shadow-xl">
      {/* Close Icon */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
        Verify your phone number
      </h2>
      <p className="text-sm text-center text-gray-500 mb-6">
        We’ll send you an SMS with a verification code.
      </p>

      {/* Inputs */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Country Dropdown */}
        <div className="relative w-full sm:w-1/2">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-md shadow-sm"
          >
            <span className="truncate">{selectedCountry}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto text-sm">
              {countries.map((country) => (
                <button
                  key={country}
                  onClick={() => handleCountrySelect(country)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700"
                >
                  {country}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone Input */}
        <input
          type="tel"
          value={localPhoneNumber}
          onChange={(e) => setLocalPhoneNumber(e.target.value)}
          placeholder="Enter phone number"
          className="w-full sm:w-1/2 px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 mt-1 mb-3">{error}</p>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 mb-6">
        Your phone number will not be visible unless you choose to display it in your ads.
      </p>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-400 rounded-full hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSendOTP}
          disabled={loading || !localPhoneNumber}
          className="px-5 py-2 text-sm font-semibold text-white bg-lime-500 rounded-full hover:bg-lime-600 transition disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Code"}
        </button>
      </div>
    </div>
  );
}

export default PhoneVerification;
