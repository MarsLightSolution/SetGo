import React from "react";
import { Search, MapPin, User, UserPlus } from "lucide-react";

function RenewPassword() {

  return (
    <div className="min-h-screen bg-gray-50">
   
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Renew Password</h1>
          <p className="text-gray-600 mb-8">
            Please enter your email address. You will then receive an email with a link where you can choose a new password.
          </p>
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="w-full h-12 px-4 border border-gray-300 rounded text-gray-700"
              />
            </div>
            <button className="bg-lime-400 hover:bg-lime-500 text-gray-800 px-8 py-3 rounded">
              Send
            </button>
          </div>
        </div>
      </main>

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

export default RenewPassword
