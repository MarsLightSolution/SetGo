import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

function PhoneVerification({ onSendOTP, setPhoneNumber, email, onClose, showCloseButton = false }) {
  const [selectedCountry, setSelectedCountry] = useState("Germany +49");
  const [localPhoneNumber, setLocalPhoneNumber] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const countries = [
    "Germany +49",
    "India +91", 
    "United States +1",
    "United Kingdom +44",
    "France +33",
    "Spain +34",
    "Italy +39",
    "Netherlands +31",
    "Canada +1",
    "Australia +61",
    "Japan +81",
    "South Korea +82",
    "Singapore +65",
    "Sweden +46",
    "Norway +47",
    "Denmark +45",
    "Finland +358",
    "Switzerland +41",
    "Austria +43",
    "Belgium +32",
  ];

  const extractCountryCode = (country) => {
    const match = country.match(/\+(\d+)/);
    return match ? match[1] : "";
  };

  const sendOTP = async () => {
    if (!localPhoneNumber.trim()) {
      setError("Please enter a phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const countryCode = extractCountryCode(selectedCountry);
      const fullPhoneNumber = `+${countryCode}${localPhoneNumber}`;
      
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER}/api/auth/send-otp`,
        {
          phoneNumber: fullPhoneNumber,
          email: email,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setPhoneNumber(fullPhoneNumber);
        if (onSendOTP) {
          onSendOTP();
        } else {
          navigate("/SMS");
        }
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "An error occurred while sending OTP. Please try again."
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
        Phone Verification
      </h2>

      <div className="space-y-4">
        {/* Country Selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
          >
            <span>{selectedCountry}</span>
            <ChevronDown
              size={16}
              className={`transform transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {countries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(country);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  {country}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="flex">
            <div className="flex items-center px-3 py-2 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
              <span className="text-sm text-gray-600">
                +{extractCountryCode(selectedCountry)}
              </span>
            </div>
            <input
              type="tel"
              value={localPhoneNumber}
              onChange={(e) => setLocalPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <button
          onClick={sendOTP}
          disabled={loading}
          className="w-full bg-lime-500 text-white py-2 px-4 rounded-md hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </div>
    </div>
  );
}

export default PhoneVerification;