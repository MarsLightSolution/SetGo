import React from 'react';
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function DataProtection() {
  const navigate = useNavigate();

  const sidebarItems = [
    { label: "Profile information", icon: "👤", path: "/profile" },
    { label: "Account settings", icon: "⚙️", path: "/accountsettings" },
    { label: "Payments", icon: "💳", path: "/paymentsettings" },
    { label: "Data protection", icon: "🛡️", path: "/dataprotection", active: true },
    { label: "Emails", icon: "✉️", path: "/emailsettings" },
    { label: "About Classified Ads", icon: "❤️", path: "/aboutclassifieds" },
  ];

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Layout Wrapper */}
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
          <nav className="space-y-1 text-sm font-medium">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center px-3 py-2 rounded-md text-left ${
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Protection</h2>

          <div className="flex items-center gap-2 text-gray-600 text-sm mb-6">
            <Eye className="w-4 h-4" />
            <span>All information is visible only to you</span>
          </div>

          {/* Settings Items */}
          <div className="space-y-4">
            {[
              "Privacy Settings, Measurement & Analysis",
              "Privacy Policy",
              "Privacy",
            ].map((title, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center border-b border-gray-100 py-2.5"
              >
                <div className="flex items-center gap-10">
                  <label className="text-sm font-medium text-gray-700 w-64">
                    {title}
                  </label>
                </div>
                <button className="text-green-600 hover:text-green-700 text-sm">Change</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-sm text-gray-600">
            {[
              {
                title: "Classifieds",
                items: ["About Us", "Career", "Press", "Classifieds Magazine", "Engagement", "Mobile Apps"],
              },
              {
                title: "Information",
                items: ["Help", "Tips for your safety", "Child and your protection", "Privacy Policy", "Privacy Settings", "Terms of use"],
              },
              {
                title: "For companies",
                items: ["Classified Real Estate", "PRO Infopoint", "PRO Packages for companies", "Advertising on classifieds"],
              },
              {
                title: "Social Media",
                items: ["Facebook", "Youtube", "Instagram", "Threads", "Pinterest", "Tik Tok"],
              },
              {
                title: "Generally",
                items: ["Popular searches", "Ads Overview", "Overview of company pages", "Car valuation"],
              },
            ].map((section, idx) => (
              <div key={idx}>
                <h3 className="font-semibold text-gray-900 mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item}>
                      <a href="#" className="hover:text-gray-900">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>
              Copyright © 2005-2025 Marketplaces BV. All rights reserved.
              <br />
              Designated trademarks belong to their respective owners. The classifieds services are operated by kleinanzeigen.de GmbH.
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

export default DataProtection;
