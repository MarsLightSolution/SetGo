import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";


function AboutClassifieds() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Sidebar items with translation keys
  const sidebarItems = [
    { labelKey: "profileMgmt.profileInfo", icon: "👤", path: "/profile" },
    { labelKey: "profileMgmt.accountSettings", icon: "⚙️", path: "/accountsettings" },
    { labelKey: "profileMgmt.payments", icon: "💳", path: "/paymentsettings" },
    { labelKey: "profileMgmt.dataProtection", icon: "🛡️", path: "/dataprotection" },
    { labelKey: "profileMgmt.emails", icon: "✉️", path: "/emailsettings" },
    { labelKey: "profileMgmt.aboutClassifiedAds", icon: "❤️", path: "/aboutclassifieds", active: true },
  ];

  return (
    <motion.div
      className="min-h-screen bg-gray-50 flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Content Wrapper (consistent with other settings pages) */}
      <div className="flex-1 py-10 px-4">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex flex-col md:flex-row overflow-hidden">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-6">
              {t("profileMgmt.settingsTitle")}
            </h1>
            <nav className="space-y-1 text-sm font-medium">
              {sidebarItems.map((item) => (
                <button
                  key={item.labelKey}
                  onClick={() => navigate(item.path)}
                  className={`flex w-full items-center px-3 py-2 rounded-md text-left transition duration-200 cursor-pointer ${
                    item.active
                      ? "text-green-700 bg-green-50"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {t(item.labelKey)}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {t("aboutClassifieds.mainTitle")}
            </h2>

            <div className="space-y-4 text-sm">
              {/* Imprint */}
              <div className="flex justify-between items-center border-b border-gray-100 py-2.5 flex-wrap">
                <p className="font-medium text-gray-700">
                  {t("aboutClassifieds.imprintLabel")}
                </p>
                <button className="text-green-600 hover:text-green-700">
                  {t("aboutClassifieds.openButton")}
                </button>
              </div>

              {/* Career Page */}
              <div className="flex justify-between items-center border-b border-gray-100 py-2.5 flex-wrap">
                <p className="font-medium text-gray-700">
                  {t("aboutClassifieds.careerPageLabel")}
                </p>
                <button className="text-green-600 hover:text-green-700">
                  {t("aboutClassifieds.openButton")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  );
}

export default AboutClassifieds;
