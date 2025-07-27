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
      className="flex items-center justify-center w-full px-1 py-1"
    >
      <div className="relative bg-white w-full max-w-xl rounded-2xl p-4 sm:p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Is it really you?</h1>
          <div className="w-16 h-1 bg-lime-500 mx-auto mt-3 rounded" />
        </div>

        {/* Main Content */}
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Left - Image */}
          <div className="sm:w-1/3 flex-shrink-0">
            <img
              src={phoneImage}
              alt="Verification"
              className="w-full h-auto object-contain rounded-md shadow cursor-pointer"
            />
          </div>

          {/* Right - Text */}
          <div className="flex-1 text-sm text-gray-700 leading-relaxed">
            <p className="mb-4">
              For your protection and the protection of everyone else on Classifieds, we want to make sure you're really you.
            </p>
            <p className="mb-4">
              Therefore, we ask you to verify your phone number.
            </p>
            <p className="text-gray-600">
              We will not share or publish your phone number. You can still decide whether to include it in your ads.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-400 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onNext}
            className="px-5 py-2 text-sm font-semibold text-white bg-lime-500 hover:bg-lime-600 rounded-full transition cursor-pointer"
          >
            Continue
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default ChangePhone;
