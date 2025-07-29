import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from "lucide-react";
import { motion } from 'framer-motion';

// i18n import
import { useTranslation } from 'react-i18next';

function DataProtection() {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const navigate = useNavigate();

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* White Card Layout */}
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">{t("profileMgmt.settingsTitle")}</h1> {/* Reusing key */}
          <nav className="space-y-1 text-sm font-medium">
            <button onClick={() => navigate('/profile')} className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">👤</span> {t("profileMgmt.profileInfo")} {/* Reusing key */}
            </button>
            <button onClick={() => navigate('/accountsettings')} className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">⚙️</span> {t("profileMgmt.accountSettings")} {/* Reusing key */}
            </button>
            <button onClick={() => navigate('/paymentsettings')} className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">💳</span> {t("profileMgmt.payments")} {/* Reusing key */}
            </button>
            <button onClick={() => navigate('/dataprotection')} className="flex items-center w-full text-left px-3 py-2 text-green-700 bg-green-50 rounded-md">
              <span className="mr-3">🛡️</span> {t("profileMgmt.dataProtection")} {/* Reusing key */}
            </button>
            <button onClick={() => navigate('/emailsettings')} className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">✉️</span> {t("profileMgmt.emails")} {/* Reusing key */}
            </button>
            <button onClick={() => navigate('/aboutclassifieds')} className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">❤️</span> {t("profileMgmt.aboutClassifiedAds")} {/* Reusing key */}
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("dataProtection.mainTitle")}</h2> {/* Translated */}

          {/* Subheading */}
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-6">
            <Eye className="w-4 h-4" />
            <span>{t("dataProtection.infoVisibility")}</span> {/* Translated */}
          </div>

          {/* Data Protection Settings */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {t("dataProtection.privacySettingsLabel")} {/* Translated */}
                </label>
              </div>
              <button className="text-green-600 hover:text-green-700 text-sm">{t("dataProtection.openButton")}</button> {/* Translated */}
            </div>

            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-64">
                  {t("dataProtection.privacyPolicyLabel")} {/* Translated */}
                </label>
              </div>
              <button className="text-green-600 hover:text-green-700 text-sm">{t("dataProtection.openButton")}</button> {/* Translated */}
            </div>

            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-64">
                  {t("dataProtection.privacyLabel")} {/* Translated */}
                </label>
              </div>
              <button className="text-green-600 hover:text-green-700 text-sm">{t("dataProtection.openButton")}</button> {/* Translated */}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default DataProtection;