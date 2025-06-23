import React from 'react';
import phoneImage from "../../assets/images/post1.png"

function Postcard1() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white w-[512px] h-[306.67px] rounded-xl shadow-lg p-4 flex flex-col">
        
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-lg font-bold text-black">Is it really you?</h1>
          <div className="w-full h-px bg-gray-300 mt-1"></div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 gap-3 overflow-hidden">
          {/* Left - Image */}
          <div className="w-1/3 flex-shrink-0">
            <img
              src={phoneImage}
              alt="Verification"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Right - Text */}
          <div className="flex-1 text-sm text-black leading-snug overflow-auto pr-1">
            <p className="mb-1">
              For your protection and the protection of everyone else on Classifieds, we want to make sure you're really you.
            </p>
            <p className="mb-1">
              Therefore, we ask you to verify your phone number.
            </p>
            <p>
              We will not share or publish your phone number. You can still decide whether to include it in your ads.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-2">
          <button className="px-4 py-1.5 text-sm font-semibold text-green-800 border border-green-800 rounded-full hover:bg-green-800 hover:text-white transition">
            Help
          </button>
          <button className="px-4 py-1.5 text-sm font-semibold text-white bg-lime-500 rounded-full hover:bg-lime-600 transition">
            Further
          </button>
        </div>
      </div>
    </div>
  );
}

export default Postcard1;
