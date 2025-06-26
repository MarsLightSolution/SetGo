import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import phoneImage from '../../assets/images/post1.png';

function ChangePhone({ onClose, onNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center justify-center w-full"
    >
      <div className="relative bg-white w-[600px] rounded-xl px-1 py-1 flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-black">Is it really you?</h1>
          <div className="w-full h-px bg-gray-300 mt-5" />
        </div>

        {/* Main Content */}
        <div className="flex gap-4">
          {/* Left - Image */}
          <div className="w-1/3 flex-shrink-0">
            <img src={phoneImage} alt="Verification" className="w-full h-auto object-contain rounded" />
          </div>

          {/* Right - Text */}
          <div className="flex-1 text-sm text-black leading-relaxed text-justify">
            <p className="mb-4">
              For your protection and the protection of everyone else on Classifieds, we want to make sure you're really you.
            </p>
            <p className="mb-2">
              Therefore, we ask you to verify your phone number.
            </p>
            <p>
              We will not share or publish your phone number. You can still decide whether to include it in your ads.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-green-800 border border-green-800 rounded-full hover:bg-green-800 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={onNext}
            className="px-5 py-2 text-sm font-semibold text-white bg-lime-500 rounded-full hover:bg-lime-600 transition"
          >
            Further
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default ChangePhone;
