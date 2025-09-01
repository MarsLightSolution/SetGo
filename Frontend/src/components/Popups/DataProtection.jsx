import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from "lucide-react";
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Import Footer
import Footer from '../common/Footer';

function DataProtection() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <motion.div
        className="flex-1 py-10 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* White Card Layout */}
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex flex-col md:flex-row overflow-hidden">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-6">
              {t("profileMgmt.settingsTitle")}
            </h1>
            <nav className="space-y-1 text-sm font-medium">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <span className="mr-3">👤</span> {t("profileMgmt.profileInfo")}
              </button>
              <button
                onClick={() => navigate('/accountsettings')}
                className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <span className="mr-3">⚙️</span> {t("profileMgmt.accountSettings")}
              </button>
              <button
                onClick={() => navigate('/paymentsettings')}
                className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <span className="mr-3">💳</span> {t("profileMgmt.payments")}
              </button>
              <button
                onClick={() => navigate('/dataprotection')}
                className="flex items-center w-full text-left px-3 py-2 text-green-700 bg-green-50 rounded-md"
              >
                <span className="mr-3">🛡️</span> {t("profileMgmt.dataProtection")}
              </button>
              <button
                onClick={() => navigate('/emailsettings')}
                className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <span className="mr-3">✉️</span> {t("profileMgmt.emails")}
              </button>
              <button
                onClick={() => navigate('/aboutclassifieds')}
                className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <span className="mr-3">❤️</span> {t("profileMgmt.aboutClassifiedAds")}
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t("dataProtection.mainTitle")}
            </h2>

            {/* Subheading */}
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-6">
              <Eye className="w-4 h-4" />
              <span>{t("dataProtection.infoVisibility")}</span>
            </div>

            {/* Data Protection Settings */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 py-2.5">
                <label className="text-sm font-medium text-gray-700">
                  {t("dataProtection.privacySettingsLabel")}
                </label>
                <button className="text-green-600 hover:text-green-700 text-sm mt-2 sm:mt-0">
                  {t("dataProtection.openButton")}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 py-2.5">
                <label className="text-sm font-medium text-gray-700">
                  {t("dataProtection.privacyPolicyLabel")}
                </label>
                <button className="text-green-600 hover:text-green-700 text-sm mt-2 sm:mt-0">
                  {t("dataProtection.openButton")}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 py-2.5">
                <label className="text-sm font-medium text-gray-700">
                  {t("dataProtection.privacyLabel")}
                </label>
                <button className="text-green-600 hover:text-green-700 text-sm mt-2 sm:mt-0">
                  {t("dataProtection.openButton")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default DataProtection;
