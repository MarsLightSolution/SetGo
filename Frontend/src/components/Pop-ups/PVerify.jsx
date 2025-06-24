import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PhoneVerification from './PhoneVerification';
import SmsVerify from './SmsVerify';

function PVerify() {
  const [step, setStep] = useState('popup'); // 'popup' → 'phone' → 'sms'

  return (
    <div className="relative min-h-screen bg-gray-50 text-center">
      {/* Message below navbar */}
      <div className={`p-6 text-left ${step === 'popup' ? "brightness-90" : ""}`}>
        <h1 className="text-xl text-gray-800 font-medium">
          Please wait, your information is being verified...
        </h1>
      </div>

      {/* Shared Modal Overlay */}
      <div className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-brightness-75 z-50">
        <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 'popup' && (
              <motion.div
                key="popup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button
                  className="absolute top-4 right-4 text-gray-600 hover:text-black text-2xl"
                  onClick={() => setStep('phone')}
                >
                  &times;
                </button>

                <h2 className="text-xl font-bold mb-4">Is it really you?</h2>

                <div className="flex items-start space-x-4">
                  <div className="text-5xl">📱</div>
                  <div className="text-sm text-gray-700">
                    <p className="mb-2">
                      For your protection and the protection of everyone else on Classifieds, we want to make sure you're really you. Therefore, we ask you to verify your phone number.
                    </p>
                    <p className="text-xs text-gray-500">
                      We will not share or publish your phone number. You can still decide whether to include a number in your ads.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-sm">Help</button>
                  <button
                    onClick={() => setStep('phone')}
                    className="bg-lime-500 hover:bg-lime-600 text-white px-4 py-2 rounded-md text-sm font-semibold"
                  >
                    Further
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
              >
                <PhoneVerification onSendOTP={() => setStep('sms')} />
              </motion.div>
            )}

            {step === 'sms' && (
              <motion.div
                key="sms"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
              >
                <SmsVerify />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default PVerify;
