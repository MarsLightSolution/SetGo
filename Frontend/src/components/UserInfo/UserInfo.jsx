import React from "react";
import { useNavigate } from "react-router-dom";
import bannerImage from "../../assets/images/banner1.png";
import nodataImage from "../../assets/images/nodata.png";

export default function UserInfo() {
  const navigate = useNavigate();

  const handlePlaceAdClick = () => {
    navigate("/form");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Banner Section */}
      <section className="py-6">
        <div className="max-w-4xl mx-auto px-4 relative">
          <img
            src={bannerImage}
            alt="User Banner"
            className="w-full h-[233px] object-cover rounded-xl shadow"
          />
          <div className="absolute bottom-6 left-10">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg">
              Join Now
            </button>
          </div>
        </div>
      </section>

      {/* Profile Section */}
      <section className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-xl font-semibold text-gray-600">
              UN
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold">Username</h2>
              </div>
              <p className="text-sm text-gray-500">0 ads available</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <UserIcon />
              <span>Private user</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon />
              <span>Active Since June 2025</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckIcon />
              <span>Verified Profile</span>
            </div>
          </div>
        </div>
      </section>

      {/* My Ads Section */}
      <section className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow p-5 text-center">
          <div className="mb-4">
            <img src={nodataImage} alt="Folder Illustration" className="mx-auto" />
          </div>
          <h4 className="text-lg font-semibold mb-1">Any Treasure left in the basement?</h4>
          <p className="text-gray-600 mb-1">You can manage your ads here.</p>
          <p className="text-gray-600 mb-4">Start advertising easily and for free.</p>
          <button
            onClick={handlePlaceAdClick}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium shadow cursor-pointer"
          >
            Place an ad
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-5">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              {
                title: "Classifieds",
                links: ["About Us", "Career", "Press", "Classifieds Magazine", "Engagement", "Mobile Apps"],
              },
              {
                title: "Information",
                links: ["Help", "Tips for your safety", "Child and your protection", "Privacy Policy", "Privacy Settings", "Terms of use"],
              },
              {
                title: "For companies",
                links: ["Classified Real Estate", "PRO Infopoint", "PRO Packages for companies", "Advertising on classifieds"],
              },
              {
                title: "Social Media",
                links: ["Facebook", "Youtube", "Instagram", "Threads", "Pinterest", "Tik Tok"],
              },
              {
                title: "Generally",
                links: ["Popular searches", "Ads Overview", "Overview of company pages", "Car valuation"],
              },
            ].map((col, i) => (
              <div key={i}>
                <h3 className="font-semibold text-gray-900 mb-4">{col.title}</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="hover:text-green-800 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-xs text-gray-500 space-y-1">
            <p>Copyright © 2005-2025 Marktplaats B.V. All rights reserved. Designated trademarks belong to their respective owners.</p>
            <p>The classifieds services are operated by kleinanzeigen.de GmbH.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Icons
const UserIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M5 13l4 4L19 7" />
  </svg>
);
