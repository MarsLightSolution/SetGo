import React, { useState } from "react";

function SmsVerify() {
  const [code, setCode] = useState("");

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white w-[518px] h-[308.8px] rounded-xl shadow-lg p-6 flex flex-col justify-between">
        
        {/* Title */}
        <h1 className="text-lg font-semibold text-gray-900 text-center leading-snug">
          SMS verification code has been sent to you
        </h1>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Phone number display */}
        <div className="text-center text-sm">
          <span className="text-green-600 font-medium cursor-pointer hover:underline">Change</span>
          <span className="text-gray-700 ml-1">code sent to +499182736455</span>
        </div>

        {/* Code input */}
        <div className="space-y-1">
          <input
            type="text"
            placeholder="Your Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-gray-600 text-xs">Please enter the verification code you received here</p>
        </div>

        {/* Resend section */}
        <div className="text-center text-sm">
          <span className="text-gray-700">Didn't receive the code? </span>
          <button className="text-green-600 font-medium hover:underline">Resend</button>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-2">
          <button
            onClick={() => console.log("Help clicked")}
            className="px-8 py-3 text-base font-semibold text-green-800 border border-green-800 rounded-full hover:bg-green-800 hover:text-white transition"
          >
            Help
          </button>
          <button
            onClick={() => console.log("Code submitted:", code)}
            className="px-8 py-3 text-base font-semibold text-white bg-lime-500 rounded-full hover:bg-lime-600 transition"
          >
            Ready
          </button>
        </div>
      </div>
    </div>
  );
}

export default SmsVerify;
