import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PhoneVerification from '../common/PhoneVerification';
import SmsVerify from '../common/SmsVerification';
import { useLocation, useNavigate } from 'react-router-dom';

import phoneImage from '../../assets/images/post1.png';

function PVerify() {
  const [step, setStep] = useState('popup'); // 'popup' → 'phone' → 'sms'
  const [phoneNumber, setPhoneNumber] = useState('');
  const email = useLocation().state?.email || '';
  const navigate = useNavigate();
  const handlelogin = () => {
    navigate('/login');
  };
  return (
    <div className="relative min-h-screen bg-gray-50 text-center">
      {/* Message below navbar */}
     <div className={`p-6 text-left ${step === 'popup' ? 'brightness-90' : ''}`}>
<div
  className={`absolute top-4 left-4 z-40 ${step === 'popup' ? 'brightness-90' : ''}`}
>
  <p className="text-sm font-semibold text-gray-700 bg-white/60 px-4 py-2 rounded-md shadow-sm backdrop-blur-md font-[Inter]">
    Please wait, your information is being verified...
  </p>
</div>
      </div>


      {/* Modal overlay */}
      <div className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-brightness-75 z-50">
        <div className="bg-white p-5 rounded-xl shadow-xl max-w-md w-full relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 'popup' && (
         <motion.div
      key="popup"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center justify-center" // centers in parent
    >
      <div className="bg-white w-[600px] rounded-xl p-1 flex flex-col">
        
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-black">Is it really you?</h1>
          <div className="w-full h-px bg-gray-300 mt-4"></div>
        </div>

        {/* Main Content */}
        <div className="flex gap-4">
          {/* Left - Image */}
          <div className="w-1/3 flex-shrink-0">
            <img
              src={phoneImage}
              alt="Verification"
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Right - Text */}
          <div className="flex-1 text-sm text-black leading-snug text-justify">
            <p className="mb-2">
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
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={()=>{handlelogin()}} className="px-5 py-2 text-sm font-semibold text-green-800 border border-green-800 rounded-full hover:bg-green-800 hover:text-white transition">
            Login
          </button>
          <button
            onClick={() => setStep('phone')}
            className="px-5 py-2 text-sm font-semibold text-white bg-lime-500 rounded-full hover:bg-lime-600 transition"
          >
            Further
          </button>
        </div>
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
                <PhoneVerification
                  onSendOTP={() => setStep('sms')}
                  setPhoneNumber={setPhoneNumber}
                  email={email}
                />
              </motion.div>
            )}

            {step === 'sms' && (
              <motion.div
                key="sms"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
              >
                <SmsVerify phoneNumber={phoneNumber} email={email} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default PVerify;
