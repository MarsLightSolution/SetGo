import React from 'react'
import EmailImage from "../../assets/images/post2.png"
function EmailNotification() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">Email</h1>

          <div className="text-center mb-8">
            <div className="w-80 h-64 mx-auto mb-6 flex items-center justify-center">
              <img
                src={EmailImage}
                alt="Email illustration with envelope and person"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-6 text-gray-900">
            <p className="text-base leading-relaxed">
              If there is a user account with this email address, we have sent you an email to johndoe@gmail.com. Please
              follow the link in the email to create a new password.
            </p>

            <div>
              <p className="font-medium mb-3 text-base">Can't find the email or didn't receive an email?</p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-base">Check your spam or junk mail folder.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-base">Filter your received emails by the keywords "classifieds".</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-base">Have a new email sent to you</span>
                </li>
              </ul>
            </div>

            <p className="text-base">Further tips can be found on our help page.</p>

            <div className="text-center pt-4">
              <button className="bg-lime-400 text-green-800 hover:bg-green-800 hover:text-white px-8 py-3 rounded font-medium transition-colors">
                Send new email
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Classifieds</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Career
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Press
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Classifieds Magazine
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Engagement
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Mobile Apps
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Information</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Help
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Tips for your safety
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Child and your protection
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Privacy Settings
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Terms of use
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">For companies</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Classified Real Estate
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    PRO Infopoint
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    PRO Packages for companies
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Advertising on classifieds
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Social Media</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Youtube
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Threads
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Pinterest
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Tik Tok
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Generally</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Popular searches
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Ads Overview
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Overview of company pages
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-green-800 transition-colors">
                    Car valuation
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-xs text-gray-500 space-y-1">
            <p>
              Copyright © 2005-2025 Marktplaats B.V. All rights reserved. Designated trademarks belong to their
              respective owners.
            </p>
            <p>The classifieds services are operated by kleinanzeigen.de GmbH.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}



export default EmailNotification
