import React, { useState } from 'react';
import { Eye, X } from "lucide-react";

function PaymentSettings() {
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-10 relative">
      {/* Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-brightness-75 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-black"
              onClick={() => setShowPayoutModal(false)}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Set up a payout account</h2>
            <p className="text-gray-700 text-sm mb-6">
              You can deposit your payout account during your first <strong>"Secure Pay"</strong> transaction.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="bg-lime-400 hover:bg-lime-500 text-white font-medium text-sm px-6 py-2 rounded-full"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
          <nav className="space-y-1 text-sm font-medium">
            <a href="/profile" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">👤</span> Profile information
            </a>
            <a href="/accountsettings" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">⚙️</span> Account settings
            </a>
            <a href="/paymentsettings" className="flex items-center px-3 py-2 text-green-700 bg-green-50 rounded-md">
              <span className="mr-3">💳</span> Payments
            </a>
            <a href="/dataprotection" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">🛡️</span> Data protection
            </a>
            <a href="/emailsettings" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">✉️</span> Emails
            </a>
            <a href="/aboutclassifieds" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">❤️</span> About Classified Ads
            </a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payments</h2>

          <div className="flex items-center gap-2 text-gray-600 text-sm mb-6">
            <Eye className="w-4 h-4" />
            <span>All information is visible only to you</span>
          </div>

          {/* Payout Account Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-40">Payout Account</label>
                <span className="text-gray-900 text-sm">XXXX XXXX XXXX XXXX XXXX XX</span>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="text-green-600 hover:text-green-700 text-sm"
              >
                Change
              </button>
            </div>
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
                items: ["About Us", "Career", "Press", "Classifieds Magazine", "Engagement", "Mobile Apps"]
              },
              {
                title: "Information",
                items: ["Help", "Tips for your safety", "Child and your protection", "Privacy Policy", "Privacy Settings", "Terms of use"]
              },
              {
                title: "For companies",
                items: ["Classified Real Estate", "PRO Infopoint", "PRO Packages for companies", "Advertising on classifieds"]
              },
              {
                title: "Social Media",
                items: ["Facebook", "Youtube", "Instagram", "Threads", "Pinterest", "Tik Tok"]
              },
              {
                title: "Generally",
                items: ["Popular searches", "Ads Overview", "Overview of company pages", "Car valuation"]
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
    </div>
  );
}

export default PaymentSettings;