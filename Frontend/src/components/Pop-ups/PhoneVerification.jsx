import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

function PhoneVerification() {
  const [selectedCountry, setSelectedCountry] = useState("Germany +49");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const countries = [
    "Germany +49",
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

  const handleConfirm = () => {
    console.log("Phone verification requested for:", selectedCountry, phoneNumber);
  };

  const handleHelp = () => {
    console.log("Help requested");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white w-[512px] h-[277.2px] rounded-xl shadow-lg p-5 flex flex-col justify-between overflow-hidden">
        
        {/* Heading */}
        <div>
          <h1 className="text-base font-semibold text-gray-900 mb-2">Please enter your phone number</h1>
          <div className="w-full h-px bg-gray-300 mb-3"></div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto space-y-4 pr-1">
          <p className="text-sm text-gray-700">
            You will then receive an SMS with a verification code.
          </p>

          {/* Input fields side by side */}
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

            {/* Phone input */}
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone number"
              className="w-1/2 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-green-500"
            />
          </div>

          <p className="text-sm text-gray-600">
            Your phone number will not be published unless you explicitly specify this.
          </p>
        </div>

       {/* Buttons */}
<div className="flex justify-end gap-4 pt-3">
  <button
    onClick={handleHelp}
    className="px-6 py-2 text-base font-semibold text-green-800 border border-green-800 rounded-full hover:bg-green-800 hover:text-white transition"
  >
    Help
  </button>
  <button
    onClick={handleConfirm}
    className="px-6 py-2 text-base font-semibold text-white bg-lime-500 rounded-full hover:bg-lime-600 transition"
  >
    Confirm
  </button>
</div>

      </div>
    </div>
  );
}

export default PhoneVerification;
