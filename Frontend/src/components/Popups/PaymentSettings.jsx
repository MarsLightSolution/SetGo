import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // Keep AnimatePresence if it's used elsewhere for modals
import { Eye, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';

// i18n import
import { useTranslation } from 'react-i18next';

function PaymentSettings() {
  const { t } = useTranslation(); // Initialize useTranslation hook
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
              className="absolute top-4 right-4 text-gray-600 hover:text-black cursor-pointer"
              onClick={() => setShowPayoutModal(false)}
              aria-label={t("paymentSettings.closeButtonAriaLabel")} // Translated
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("paymentSettings.setupPayoutAccountTitle")}</h2> {/* Translated */}
            <p className="text-gray-700 text-sm mb-6">
              {t("paymentSettings.payoutAccountInstructions1")}{" "}
              <strong>{t("paymentSettings.securePay")}</strong>{" "}
              {t("paymentSettings.payoutAccountInstructions2")}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="bg-lime-400 hover:bg-lime-500 text-white font-medium text-sm px-6 py-2 rounded-full cursor-pointer"
              >
                {t("paymentSettings.understoodButton")} {/* Translated */}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Layout */}
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">{t("profileMgmt.settingsTitle")}</h1> {/* Reusing key */}
          <nav className="space-y-1 text-sm font-medium">
            <button onClick={() => navigate('/profile')} className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left">
              <span className="mr-3">👤</span> {t("profileMgmt.profileInfo")} {/* Reusing key */}
            </button>
            <button onClick={() => navigate('/accountsettings')} className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left">
              <span className="mr-3">⚙️</span> {t("profileMgmt.accountSettings")} {/* Reusing key */}
            </button>
            <button onClick={() => navigate('/paymentsettings')} className="flex items-center px-3 py-2 text-green-700 bg-green-50 rounded-md w-full text-left">
              <span className="mr-3">💳</span> {t("profileMgmt.payments")} {/* Reusing key */}
            </button>
            <button onClick={() => navigate('/dataprotection')} className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left">
              <span className="mr-3">🛡️</span> {t("profileMgmt.dataProtection")} {/* Reusing key */}
            </button>
            <button onClick={() => navigate('/emailsettings')} className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left">
              <span className="mr-3">✉️</span> {t("profileMgmt.emails")} {/* Reusing key */}
            </button>
            <button onClick={() => navigate('/aboutclassifieds')} className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left">
              <span className="mr-3">❤️</span> {t("profileMgmt.aboutClassifiedAds")} {/* Reusing key */}
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("paymentSettings.mainTitle")}</h2> {/* Translated */}

          <div className="flex items-center gap-2 text-gray-600 text-sm mb-6">
            <Eye className="w-4 h-4" />
            <span>{t("paymentSettings.infoVisibility")}</span> {/* Translated */}
          </div>

          {/* Payout Account Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-40">{t("paymentSettings.payoutAccountLabel")}</label> {/* Translated */}
                <span className="text-gray-900 text-sm">XXXX XXXX XXXX XXXX XXXX XX</span>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="text-green-600 hover:text-green-700 text-sm cursor-pointer"
              >
                {t("paymentSettings.changeButton")} {/* Translated */}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default PaymentSettings;