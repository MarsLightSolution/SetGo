import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

// i18n import
import { useTranslation } from "react-i18next";

function EmailSettings() {
  const { t } = useTranslation();
  const [newsletter, setNewsletter] = useState(false);
  const [messagesFromUsers, setMessagesFromUsers] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");

  const handleToggleNewsletter = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER}/newsletter/${userId}`
      );
      setNewsletter(res.data.data.newsletter);
      toast.success(t("emailSettings.newsletterToggleSuccess"));
    } catch (err) {
      console.error("Error toggling newsletter:", err);
      toast.error(t("emailSettings.newsletterToggleError"));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMessages = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER}/messageforuser/${userId}`
      );
      setMessagesFromUsers(res.data.data.messageforuser);
      toast.success(t("emailSettings.messagesToggleSuccess"));
    } catch (err) {
      console.error("Error toggling messages:", err);
      toast.error(t("emailSettings.messagesToggleError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch preferences if needed
  }, []);

  const sidebarItems = [
    { labelKey: "profileMgmt.profileInfo", icon: "👤", path: "/profile" },
    { labelKey: "profileMgmt.accountSettings", icon: "⚙️", path: "/accountsettings" },
    { labelKey: "profileMgmt.payments", icon: "💳", path: "/paymentsettings" },
    { labelKey: "profileMgmt.dataProtection", icon: "🛡️", path: "/dataprotection" },
    { labelKey: "profileMgmt.emails", icon: "🔔", path: "/emailsettings", active: true },
    { labelKey: "profileMgmt.aboutClassifiedAds", icon: "❤️", path: "/aboutclassifieds" },
  ];

  return (
   <motion.div
  className="min-h-screen bg-gray-50 flex flex-col"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <ToastContainer position="top-right" autoClose={3000} />

  {/* Content Wrapper (same as profile + account settings) */}
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
          {t("emailSettings.mainTitle")}
        </h2>

        <div className="space-y-6 text-sm">
          {/* Newsletter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-100 rounded p-4 bg-gray-50">
            <div className="flex-1 sm:pr-4 mb-4 sm:mb-0">
              <p className="font-medium text-gray-800 mb-1">
                {t("emailSettings.newsletterTitle")}
              </p>
              <p className="text-gray-600">
                {t("emailSettings.newsletterDescription")}
              </p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only cursor-pointer"
                checked={newsletter}
                onChange={handleToggleNewsletter}
              />
              <div
                className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                  newsletter ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                    newsletter ? "translate-x-5" : ""
                  }`}
                ></div>
              </div>
            </label>
          </div>

          {/* Messages from users */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-100 rounded p-4">
            <div className="flex-1 sm:pr-4 mb-4 sm:mb-0">
              <p className="font-medium text-gray-800 mb-1">
                {t("emailSettings.messagesFromUsersTitle")}
              </p>
              <p className="text-gray-600">
                {t("emailSettings.messagesFromUsersDescription")}
              </p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only cursor-pointer"
                checked={messagesFromUsers}
                onChange={handleToggleMessages}
              />
              <div
                className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                  messagesFromUsers ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                    messagesFromUsers ? "translate-x-5" : ""
                  }`}
                ></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>

</motion.div>

  );
}

export default EmailSettings;
