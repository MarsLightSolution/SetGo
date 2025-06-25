import React from 'react'
import { ChevronDown, Search, MapPin, User, Plus } from "lucide-react"


function NewPassword() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="p-8">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-4">New Password</h1>
            <p className="text-gray-600 mb-8">
              Please enter your new password below. Make sure it's secure and easy for you to remember.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <label className="w-40 text-gray-700 font-medium">New Password</label>
                <input type="password" className="flex-1 max-w-md border border-gray-300 rounded-md px-4 py-2" />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-40 text-gray-700 font-medium">Confirm Password</label>
                <input type="password" className="flex-1 max-w-md border border-gray-300 rounded-md px-4 py-2" />
              </div>

              <div className="flex justify-center pt-4">
                <button className="bg-white text-green-600 border-2 border-green-600 hover:bg-green-50 px-12 py-2 rounded-full">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-5 gap-8 text-sm text-gray-600">
          {/* Reuse logic as before */}
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
            }
          ].map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-gray-800 mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-gray-800">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t mt-8 pt-6 text-center text-sm text-gray-500">
          <p>
            Copyright © 2005-2025 Marketplaces BV. All rights reserved.
            <br />
            The classifieds services are operated by kleinanzeigen.de GmbH.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default NewPassword
