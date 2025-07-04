import React, { useState } from 'react';
import { Eye, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../common/Footer';

function PaymentSettings() {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-10 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Modal */}
      {showPayoutModal && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-brightness-75 z-50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-black"
              onClick={() => setShowPayoutModal(false)}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Set up a payout account</h2>
            <p className="text-gray-700 text-sm mb-6">
              You can deposit your payout account during your first <strong>"Secure Pay"</strong> transaction.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="bg-lime-400 hover:bg-lime-500 text-white font-medium text-sm px-6 py-2 rounded-full"
              >
                Understood
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Layout */}
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
          <nav className="space-y-1 text-sm font-medium">
            <button onClick={() => navigate('/profile')} className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left">
              <span className="mr-3">👤</span> Profile information
            </button>
            <button onClick={() => navigate('/accountsettings')} className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left">
              <span className="mr-3">⚙️</span> Account settings
            </button>
            <button onClick={() => navigate('/paymentsettings')} className="flex items-center px-3 py-2 text-green-700 bg-green-50 rounded-md w-full text-left">
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payments</h2>

          <div className="flex items-center gap-2 text-gray-600 text-sm mb-6">
            <Eye className="w-4 h-4" />
            <span>All information is visible only to you</span>
          </div>

          {/* Payout Account Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-40">Payout Account</label>
                <span className="text-gray-900 text-sm">XXXX XXXX XXXX XXXX XXXX XX</span>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="text-green-600 hover:text-green-700 text-sm"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10">
        <Footer />
      </div>
    </motion.div>
  );
}

export default PaymentSettings;
