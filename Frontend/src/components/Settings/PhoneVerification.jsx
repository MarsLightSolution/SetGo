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

    const countryCode = selectedCountry.split(" ")[1]; // e.g. "+49"
    const fullNumber = `${countryCode}${localPhoneNumber}`;

    try {
      const res = await axios.post("http://localhost:8080/send-otp", {
        email: email,
        phoneNumber: fullNumber,
      });

      console.log(res.data);
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
    <div className="relative bg-white w-full max-w-xl mx-auto p-1 rounded-xl flex flex-col space-y-5">
      {/* Close icon */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Heading */}
      <h2 className="text-xl font-semibold text-center text-gray-900">
        Please enter your phone number
      </h2>
      <p className="text-sm text-center text-gray-600">
        You will receive an SMS with a verification code.
      </p>

      {/* Input Fields */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Country dropdown */}
        <div className="relative w-full sm:w-1/2">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm"
          >
            <span className="truncate">{selectedCountry}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-md max-h-40 overflow-y-auto text-sm">
              {countries.map((country) => (
                <button
                  key={country}
                  onClick={() => handleCountrySelect(country)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  {country}
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
          className="w-full sm:w-1/2 px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-lime-500"
        />
      </div>

      {/* Error message */}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Disclaimer */}
      <p className="text-sm text-gray-600">
        Your phone number will not be published unless you explicitly specify this.
      </p>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-3">
        <button
          onClick={onClose}
          className="px-5 py-2 text-sm font-medium text-green-700 border border-green-700 rounded-full hover:bg-green-700 hover:text-white transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSendOTP}
          disabled={loading || !localPhoneNumber}
          className="px-5 py-2 text-sm font-medium text-white bg-lime-500 rounded-full hover:bg-lime-600 transition disabled:opacity-50"
        >
          {loading ? "Sending..." : "Confirm"}
        </button>
      </div>
    </div>
  );
}

export default PhoneVerification;
