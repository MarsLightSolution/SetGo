import React, { useState } from 'react';
import { Eye, EyeOff, Trash2 } from "lucide-react";
;
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AddressModal from './AddressModal';
import ChangePhone from '../Settings/ChangePhone';
import PhoneVerification from '../Settings/PhoneVerification';
import SmsVerification from '../Settings/SmsVerification';
import NewPasswordModal from '../Settings/NewPasswordModal';

function AccountSettings() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [billingAddress, setBillingAddress] = useState("Current Billing Address");
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [popupStep, setPopupStep] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const userEmail = "jacobweidman42@gmail.com";
  const [showPasswordModal, setShowPasswordModal] = useState(false);


  const handleBillingUpdate = (newAddress) => {
    setBillingAddress(newAddress);
    localStorage.setItem('billingAddress', newAddress);
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
          <nav className="space-y-1 text-sm font-medium">
            <button onClick={() => navigate('/profile')} className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left">
              <span className="mr-3">👤</span> Profile information
            </button>
            <button onClick={() => navigate('/accountsettings')} className="flex items-center px-3 py-2 text-green-700 bg-green-50 rounded-md w-full text-left">
              <span className="mr-3">⚙️</span> Account settings
            </button>
            <button onClick={() => navigate('/paymentsettings')} className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left">
              <span className="mr-3">💳</span> Payments
            </button>
            <button onClick={() => navigate('/dataprotection')} className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left">
              <span className="mr-3">🛡️</span> Data protection
            </button>
            <button onClick={() => navigate('/emailsettings')} className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left">
              <span className="mr-3">✉️</span> Emails
            </button>
            <button onClick={() => navigate('/aboutclassifieds')} className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left">
              <span className="mr-3">❤️</span> About Classified Ads
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account settings</h2>

          <div className="flex items-center gap-2 text-gray-600 text-sm mb-6">
            <Eye className="w-4 h-4" />
            <span>All information is visible only to you</span>
          </div>

          <div className="space-y-4">
            {/* Verified Phone */}
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-40">Verified phone number</label>
                <span className="text-gray-900 text-sm">{phoneNumber || '+49*****863'}</span>
              </div>
              <button onClick={() => setPopupStep('popup')} className="text-green-600 hover:text-green-700 text-sm">
                Change
              </button>
            </div>

            {/* Email */}
            <div className="border-b border-gray-100 py-2.5">
              {!showEmailForm ? (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-10">
      <label className="text-sm font-medium text-gray-700 w-40">E-mail Address</label>
      <span className="text-gray-900 text-sm">{userEmail}</span>
    </div>
    <button onClick={() => setShowEmailForm(true)} className="text-green-600 hover:text-green-700 text-sm">
      Change
    </button>
  </div>
) : (
  <div className="p-6 bg-[#f4f2ed] rounded-lg space-y-4">
    <p className="text-sm text-gray-800 bg-gray-100 rounded p-4">
      To change your email address, you will receive two emails from us:
      <br /><br />
      1. An email to your current email address.<br />
      2. An email to your new address to confirm ownership.
      <br /><br />
      For more info, see the <a href="#" className="text-green-700 underline">Help section</a>.
    </p>

    <input
      type="text"
      className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-100 text-sm"
      value={userEmail}
      disabled
    />
    <input
      type="email"
      className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
      placeholder="New email address"
    />
    <input
      type="email"
      className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
      placeholder="Repeat new email address"
    />

    {/* Password with Eye Toggle */}
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        className="w-full px-4 py-2 border border-gray-300 rounded text-sm pr-10"
        placeholder="Enter password"
      />
      <button
        type="button"
        onClick={() => setShowPassword(prev => !prev)}
        className="absolute right-3 top-2.5 text-gray-400"
      >
        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>

    <div className="flex gap-4 mt-4 justify-end">
      <button
        onClick={() => setShowEmailForm(false)}
        className="px-4 py-2 border border-gray-400 rounded text-sm hover:bg-gray-100"
      >
        Cancel
      </button>
      <button className="px-4 py-2 bg-green-200 text-green-800 rounded text-sm hover:bg-green-300">
        Save new email address
      </button>
    </div>
  </div>
)}

            </div>

            {/* Password */}
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-40">Password</label>
                <span className="text-gray-900 text-sm">****</span>
              </div>
             <button onClick={() => setShowPasswordModal(true)} className="text-green-600 hover:text-green-700 text-sm">
  Change
</button>

            </div>
          </div>

          {/* Your activity */}
          <div className="mt-8 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Your activity</h3>
            <p className="text-gray-600 text-sm">
              You currently have 0 listings online. You've posted 0 listings in the last 30 days.
            </p>
          </div>

          {/* Billing Address */}
          <div className="flex items-center justify-between py-4 border-b border-gray-100 mb-8">
            <div className="flex items-center gap-6">
              <label className="text-sm font-medium text-gray-700 w-40">Billing address</label>
              <div className="text-gray-900 text-sm">{billingAddress || 'N/A'}</div>
            </div>
            <button className="text-green-600 hover:text-green-700 text-sm" onClick={() => setShowBillingModal(true)}>
              Edit
            </button>
          </div>

          {/* Delete Account */}
          <div className="flex justify-end">
            <button className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium">
              <Trash2 className="w-4 h-4" />
              Delete user account
            </button>
          </div>
        </div>
      </div>

      {/* Billing Modal */}
      <AddressModal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        onSave={handleBillingUpdate}
      />

      {/* Phone Verification Popups */}
      <AnimatePresence>
        {popupStep && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <motion.div
              key={popupStep}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-xl w-full max-w-xl"
            >
              {popupStep === 'popup' && (
                <ChangePhone
                  onClose={() => setPopupStep(null)}
                  onNext={() => setPopupStep('phone')}
                />
              )}

              {popupStep === 'phone' && (
                <PhoneVerification
                  onSendOTP={() => setPopupStep('sms')}
                  setPhoneNumber={setPhoneNumber}
                  email={userEmail}
                  onClose={() => setPopupStep(null)}
                />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
  {showPasswordModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <motion.div
        key="passwordModal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <NewPasswordModal onClose={() => setShowPasswordModal(false)} />
      </motion.div>
    </div>
  )}
</AnimatePresence>

    </motion.div>
  );
}

export default AccountSettings;
