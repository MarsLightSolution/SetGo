import React from 'react';

function ProfileMgmt() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      {/* White Card Wrapper for Sidebar + Content */}
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
          <nav className="space-y-1">
            <a
              href="/profile"
              className="flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-md"
            >
              <span className="mr-3">👤</span>
              Profile information
            </a>
            <a
              href="/accountsettings"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <span className="mr-3">⚙️</span>
              Account settings
            </a>
            <a
              href="/paymentsettings"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <span className="mr-3">💳</span>
              Payments
            </a>
            <a
              href="/dataprotection"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <span className="mr-3">🛡️</span>
              Data protection
            </a>
            <a
              href="/emailsettings"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <span className="mr-3">✉️</span>
              Emails
            </a>
            <a
              href="/aboutclassieds"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <span className="mr-3">❤️</span>
              About Classified Ads
            </a>
          </nav>
        </div>

        {/* Settings Info Content */}
        <div className="flex-1 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile information</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex items-center gap-25">
                <label className="text-sm font-medium text-gray-700">Profile name</label>
                <div className="text-gray-900">Kamran</div>
              </div>
              <button className="text-green-600 hover:text-green-700 text-sm">Edit</button>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex items-center gap-19">
                <label className="text-sm font-medium text-gray-700">Delivery address</label>
                <div className="text-gray-900">Current Address</div>
              </div>
              <button className="text-green-600 hover:text-green-700 text-sm">Edit</button>
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

export default ProfileMgmt;
