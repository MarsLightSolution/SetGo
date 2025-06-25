import React from 'react';
import { Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function AccountSettings() {
  const navigate = useNavigate();

  const menuItems = [
    { label: "Profile information", icon: "👤", path: "/profile" },
    { label: "Account settings", icon: "⚙️", path: "/accountsettings", active: true },
    { label: "Payments", icon: "💳", path: "/paymentsettings" },
    { label: "Data protection", icon: "🛡️", path: "/dataprotection" },
    { label: "Emails", icon: "✉️", path: "/emailsettings" },
    { label: "About Classified Ads", icon: "❤️", path: "/aboutclassifieds" },
  ];

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Wrapper */}
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
          <nav className="space-y-1 text-sm font-medium">
            {menuItems.map(({ label, icon, path, active }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={`flex w-full items-center px-3 py-2 rounded-md text-left transition-all duration-200
                  ${active ? "text-green-700 bg-green-50" : "text-gray-700 hover:bg-gray-100"}`}
              >
                <span className="mr-3">{icon}</span> {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <motion.div
          className="flex-1 p-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account settings</h2>

          <div className="flex items-center gap-2 text-gray-600 text-sm mb-6">
            <Eye className="w-4 h-4" />
            <span>All information is visible only to you</span>
          </div>

          <div className="space-y-4">
            {/* Phone Number */}
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-40">Verified phone number</label>
                <span className="text-gray-900 text-sm">+49*******863</span>
              </div>
              <button className="text-green-600 hover:text-green-700 text-sm">Change</button>
            </div>

            {/* Email */}
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-40">E-mail Address</label>
                <span className="text-gray-900 text-sm">jacobweidman42@gmail.com</span>
              </div>
              <button className="text-green-600 hover:text-green-700 text-sm">Change</button>
            </div>

            {/* Password */}
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-40">Password</label>
                <span className="text-gray-900 text-sm">************</span>
              </div>
              <button className="text-green-600 hover:text-green-700 text-sm">Change</button>
            </div>
          </div>

          {/* Activity */}
          <div className="mt-8 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Your activity</h3>
            <p className="text-gray-600 text-sm">
              You currently have 0 listings online. You've posted 0 listings in the last 30 days.
            </p>
          </div>

          {/* Billing Address */}
          <div className="flex justify-between items-center border-b border-gray-100 py-2.5 mb-8">
            <div className="flex items-center gap-10">
              <label className="text-sm font-medium text-gray-700 w-40">Billing address</label>
              <span className="text-gray-900 text-sm">Current Billing Address</span>
            </div>
            <button className="text-green-600 hover:text-green-700 text-sm">Edit</button>
          </div>

          {/* Delete Account */}
          <div className="flex justify-end">
            <button className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium">
              <Trash2 className="w-4 h-4" />
              Delete user account
            </button>
          </div>
        </motion.div>
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

export default AccountSettings;
