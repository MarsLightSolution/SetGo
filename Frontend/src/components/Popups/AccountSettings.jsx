import React, { useState } from 'react';
import { Eye, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';

function AccountSettings() {
  const navigate = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [billingAddress, setBillingAddress] = useState("Current Billing Address");
  const [newAddress, setNewAddress] = useState(billingAddress);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
          <nav className="space-y-1 text-sm font-medium">
            <a href="/profile" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">👤</span> Profile information
            </a>
            <a href="/accountsettings" className="flex items-center px-3 py-2 text-green-700 bg-green-50 rounded-md">
              <span className="mr-3">⚙️</span> Account settings
            </a>
            <a href="/paymentsettings" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
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
              <button
                className="text-green-600 hover:text-green-700 text-sm"
                onClick={() => navigate('/pverify')}
              >
                Change
              </button>
            </div>

            {/* Email Address */}
            <div className="border-b border-gray-100 py-2.5">
              {!showEmailForm ? (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-10">
                    <label className="text-sm font-medium text-gray-700 w-40">E-mail Address</label>
                    <span className="text-gray-900 text-sm">jacobweidman42@gmail.com</span>
                  </div>
                  <button
                    className="text-green-600 hover:text-green-700 text-sm"
                    onClick={() => setShowEmailForm(true)}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-[#f4f2ed] rounded-md">
                  <p className="text-sm text-gray-800 bg-gray-200 rounded p-4 mb-4">
                    To change your email address, you will receive two emails from us:
                    <br /><br />
                    1. For your security, we will send an email to your current email address. This email is for your information.
                    <br />
                    2. You will also receive an email to your new email address. Please confirm that you own this email account by selecting the link in the email.
                    <br /><br />
                    For more information, see the <a href="#" className="text-green-700 underline">Help section</a>.
                  </p>

                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-100 text-sm"
                      placeholder="Registered email address"
                      value="jacobweidman42@gmail.com"
                      disabled
                    />
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
                      placeholder="New email address"
                    />
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Repeat new email address"
                    />
                    <div className="relative">
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded text-sm pr-10"
                        placeholder="Enter password"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-400 cursor-pointer">
                        👁️
                      </span>
                    </div>

                    <div className="flex gap-4 mt-4">
                      <button
                        onClick={() => setShowEmailForm(false)}
                        className="px-4 py-2 border border-gray-400 rounded text-sm hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 bg-green-200 text-green-800 rounded text-sm hover:bg-green-300"
                      >
                        Save new email address
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-40">Password</label>
                <span className="text-gray-900 text-sm">************</span>
              </div>
              <button
                className="text-green-600 hover:text-green-700 text-sm"
                onClick={() => navigate('/newpassword')}
              >
                Change
              </button>
            </div>
          </div>

          {/* Activity Section */}
          <div className="mt-8 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Your activity</h3>
            <p className="text-gray-600 text-sm">
              You currently have 0 listings online. You've posted 0 listings in the last 30 days.
            </p>
          </div>

          {/* Billing Address */}
          <div className="border-b border-gray-100 py-2.5 mb-8">
            {!isEditingAddress ? (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-10">
                  <label className="text-sm font-medium text-gray-700 w-40">Billing address</label>
                  <span className="text-gray-900 text-sm">{billingAddress}</span>
                </div>
                <button
                  className="text-green-600 hover:text-green-700 text-sm"
                  onClick={() => setIsEditingAddress(true)}
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className="p-4 bg-[#f4f2ed] rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Billing Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
                  placeholder="Enter new billing address"
                />
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => {
                      setIsEditingAddress(false);
                      setNewAddress(billingAddress);
                    }}
                    className="px-4 py-2 border border-gray-400 rounded text-sm hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setBillingAddress(newAddress);
                      setIsEditingAddress(false);
                    }}
                    className="px-4 py-2 bg-green-200 text-green-800 rounded text-sm hover:bg-green-300"
                  >
                    Save address
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Delete Account */}
          <div className="flex justify-end">
            <button className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium">
              <Trash2 className="w-4 h-4" />
              Delete user account
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-sm text-gray-600">
            {[{ title: "Classifieds", items: ["About Us", "Career", "Press", "Classifieds Magazine", "Engagement", "Mobile Apps"] },
              { title: "Information", items: ["Help", "Tips for your safety", "Child and your protection", "Privacy Policy", "Privacy Settings", "Terms of use"] },
              { title: "For companies", items: ["Classified Real Estate", "PRO Infopoint", "PRO Packages for companies", "Advertising on classifieds"] },
              { title: "Social Media", items: ["Facebook", "Youtube", "Instagram", "Threads", "Pinterest", "Tik Tok"] },
              { title: "Generally", items: ["Popular searches", "Ads Overview", "Overview of company pages", "Car valuation"] }
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

export default AccountSettings;
