import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function AboutClassifieds() {
  const navigate = useNavigate();

  const sidebarItems = [
    { label: "Profile information", icon: "👤", path: "/profile" },
    { label: "Account settings", icon: "⚙️", path: "/accountsettings" },
    { label: "Payments", icon: "💳", path: "/paymentsettings" },
    { label: "Data protection", icon: "🛡️", path: "/dataprotection" },
    { label: "Emails", icon: "✉️", path: "/emailsettings" },
    { label: "About Classified Ads", icon: "❤️", path: "/aboutclassifieds", active: true }
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
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
          <nav className="space-y-1 text-sm font-medium">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center px-3 py-2 rounded-md text-left transition duration-200 cursor-pointer ${
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">About Classified ads</h2>

          <div className="space-y-4">
            {/* Imprint */}
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Imprint
                </label>
              </div>
              <button className="text-green-600 hover:text-green-700 text-sm cursor-pointer">Open</button>
            </div>

            {/* Career Page */}
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-64">
                  Career Page
                </label>
              </div>
              <button className="text-green-600 hover:text-green-700 text-sm cursor-pointer">Open</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AboutClassifieds;
