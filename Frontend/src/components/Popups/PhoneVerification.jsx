import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import axios from "axios";

function PhoneVerification({ onSendOTP, setPhoneNumber,email }) {
  const [selectedCountry, setSelectedCountry] = useState("Germany +49");
  const [localPhoneNumber, setLocalPhoneNumber] = useState(""); // renamed local state
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
      setPhoneNumber(fullNumber); // update parent state with full number
      onSendOTP(); // proceed to SMS step
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleHelp = () => {
    console.log("Help requested");
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Heading */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">
          Please enter your phone number
        </h1>
        <div className="w-full h-px bg-gray-300 mb-3"></div>
      </div>

      {/* Instructions */}
      <p className="text-sm text-gray-700">
        You will then receive an SMS with a verification code.
      </p>

      {/* Input fields */}
      <div className="flex gap-3">
        {/* Country dropdown */}
        <div className="relative w-1/2">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md"
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
          className="w-1/2 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-lime-500"
        />
      </div>

      {/* Error */}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Disclaimer */}
      <p className="text-sm text-gray-600">
        Your phone number will not be published unless you explicitly specify this.
      </p>

      {/* Buttons */}
      <div className="flex justify-end gap-4 pt-3">
        <button
          onClick={handleHelp}
          className="px-6 py-2 text-sm font-semibold text-green-800 border border-green-800 rounded-full hover:bg-green-800 hover:text-white transition"
        >
          Help
        </button>
        <button
          onClick={handleSendOTP}
          disabled={loading || !localPhoneNumber}
          className="px-6 py-2 text-sm font-semibold text-white bg-lime-500 rounded-full hover:bg-lime-600 transition"
        >
          {loading ? "Sending..." : "Confirm"}
        </button>
      </div>
    </div>
  );
}

export default PhoneVerification;
