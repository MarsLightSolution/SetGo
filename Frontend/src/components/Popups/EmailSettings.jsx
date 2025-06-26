import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function EmailSettings() {
  const [newsletter, setNewsletter] = useState(false);
  const [messagesFromUsers, setMessagesFromUsers] = useState(true);
  const navigate = useNavigate();

  const sidebarItems = [
    { label: "Profile information", icon: "👤", path: "/profile" },
    { label: "Account settings", icon: "⚙️", path: "/accountsettings" },
    { label: "Payments", icon: "💳", path: "/paymentsettings" },
    { label: "Data protection", icon: "🛡️", path: "/dataprotection" },
    { label: "Emails", icon: "🔔", path: "/emailsettings", active: true },
    { label: "About Classified Ads", icon: "❤️", path: "/aboutclassifieds" }
  ];

  const footerLinks = [
    {
      title: "Classifieds",
      items: ["about", "career", "press", "magazine", "engagement", "apps"]
    },
    {
      title: "Information",
      items: ["help", "safety", "child-protection", "privacy-policy", "privacy-settings", "terms"]
    },
    {
      title: "For companies",
      items: ["real-estate", "infopoint", "packages", "advertising"]
    },
    {
      title: "Social Media",
      items: ["facebook", "youtube", "instagram", "threads", "pinterest", "tiktok"]
    },
    {
      title: "Generally",
      items: ["searches", "ads-overview", "company-pages", "car-valuation"]
    }
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
        <div className="w-64 border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
          <nav className="space-y-1 text-sm font-medium">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center px-3 py-2 rounded-md text-left transition duration-200 ${
                  item.active
                    ? "text-green-700 bg-green-50"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Emails</h2>

          <div className="space-y-6 text-sm">
            {/* Newsletter */}
            <div className="flex justify-between items-center border border-gray-100 rounded p-4 bg-gray-50">
              <div className="flex-1 pr-4">
                <p className="font-medium text-gray-800 mb-1">Newsletter</p>
                <p className="text-gray-600">
                  You will receive regular emails with promotions, tips, product information, and exciting stories about us and affiliated companies (mobile.de). You can unsubscribe at any time.
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={newsletter}
                  onChange={() => setNewsletter(!newsletter)}
                />
                <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${newsletter ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${newsletter ? 'translate-x-5' : ''}`}></div>
                </div>
              </label>
            </div>

            {/* Messages from users */}
            <div className="flex justify-between items-center border border-gray-100 rounded p-4">
              <div className="flex-1 pr-4">
                <p className="font-medium text-gray-800 mb-1">Messages from users</p>
                <p className="text-gray-600">
                  You will receive an email as soon as you receive a message from another user.
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={messagesFromUsers}
                  onChange={() => setMessagesFromUsers(!messagesFromUsers)}
                />
                <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${messagesFromUsers ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${messagesFromUsers ? 'translate-x-5' : ''}`}></div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default EmailSettings;
