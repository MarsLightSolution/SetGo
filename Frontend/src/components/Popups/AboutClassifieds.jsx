import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// i18n import
import { useTranslation } from 'react-i18next';

function AboutClassifieds() {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const navigate = useNavigate();

  // Sidebar items are now using translation keys
  const sidebarItems = [
    { labelKey: "profileMgmt.profileInfo", icon: "👤", path: "/profile" },
    { labelKey: "profileMgmt.accountSettings", icon: "⚙️", path: "/accountsettings" },
    { labelKey: "profileMgmt.payments", icon: "💳", path: "/paymentsettings" },
    { labelKey: "profileMgmt.dataProtection", icon: "🛡️", path: "/dataprotection" },
    { labelKey: "profileMgmt.emails", icon: "✉️", path: "/emailsettings" },
    { labelKey: "profileMgmt.aboutClassifiedAds", icon: "❤️", path: "/aboutclassifieds", active: true }
  ];

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
          <h1 className="text-xl font-semibold text-gray-900 mb-6">{t("profileMgmt.settingsTitle")}</h1> {/* Reusing key */}
          <nav className="space-y-1 text-sm font-medium">
            {sidebarItems.map((item) => (
              <button
                key={item.labelKey} // Use labelKey as React key
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center px-3 py-2 rounded-md text-left transition duration-200 cursor-pointer ${
                  item.active
                    ? "text-green-700 bg-green-50"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {t(item.labelKey)} {/* Translate label */}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t("aboutClassifieds.mainTitle")}</h2> {/* Translated */}

          <div className="space-y-4">
            {/* Imprint */}
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {t("aboutClassifieds.imprintLabel")} {/* Translated */}
                </label>
              </div>
              <button className="text-green-600 hover:text-green-700 text-sm">{t("aboutClassifieds.openButton")}</button> {/* Translated */}
            </div>

            {/* Career Page */}
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-64">
                  {t("aboutClassifieds.careerPageLabel")} {/* Translated */}
                </label>
              </div>
              <button className="text-green-600 hover:text-green-700 text-sm">{t("aboutClassifieds.openButton")}</button> {/* Translated */}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AboutClassifieds;