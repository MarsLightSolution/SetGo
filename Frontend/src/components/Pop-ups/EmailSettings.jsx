import React, { useState } from 'react';

function EmailSettings() {
  const [newsletter, setNewsletter] = useState(false);
  const [messagesFromUsers, setMessagesFromUsers] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
          <nav className="space-y-1 text-sm font-medium">
            <a href="/set" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">👤</span> Profile information
            </a>
            <a href="/accountsettings" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">⚙️</span> Account settings
            </a>
            <a href="/paymentsettings" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">💳</span> Payments
            </a>
            <a href="/dataprotection" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">🛡️</span> Data protection
            </a>
            <a href="/emailsettings" className="flex items-center px-3 py-2 text-green-700 bg-green-50 rounded-md">
              <span className="mr-3">🔔</span> Emails
            </a>
            <a href="/aboutclassifieds" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              <span className="mr-3">❤️</span> About Classified Ads
            </a>
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
                <input type="checkbox" className="sr-only" checked={newsletter} onChange={() => setNewsletter(!newsletter)} />
                <div className={`w-11 h-6 bg-gray-300 rounded-full p-1 duration-300 ${newsletter ? 'bg-green-600' : ''}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform duration-300 ${newsletter ? 'translate-x-5' : ''}`}></div>
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
                <input type="checkbox" className="sr-only" checked={messagesFromUsers} onChange={() => setMessagesFromUsers(!messagesFromUsers)} />
                <div className={`w-11 h-6 bg-gray-300 rounded-full p-1 duration-300 ${messagesFromUsers ? 'bg-green-600' : ''}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform duration-300 ${messagesFromUsers ? 'translate-x-5' : ''}`}></div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-sm text-gray-600">
            {/* Sections (reused structure) */}
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
    </div>
  );
}

export default EmailSettings;
