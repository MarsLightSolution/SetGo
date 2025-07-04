import React from "react";

const Footer = () => {
  const footerColumns = [
    {
      title: "Classifieds",
      links: [
        "About Us",
        "Career",
        "Press",
        "Classifieds Magazine",
        "Engagement",
        "Mobile Apps",
      ],
    },
    {
      title: "Information",
      links: [
        "Help",
        "Tips for your safety",
        "Child and your protection",
        "Privacy Policy",
        "Privacy Settings",
        "Terms of use",
      ],
    },
    {
      title: "For companies",
      links: [
        "Classified Real Estate",
        "PRO Infopoint",
        "PRO Packages for companies",
        "Advertising on classifieds",
      ],
    },
    {
      title: "Social Media",
      links: [
        "Facebook",
        "Youtube",
        "Instagram",
        "Threads",
        "Pinterest",
        "Tik Tok",
      ],
    },
    {
      title: "Generally",
      links: [
        "Popular searches",
        "Ads Overview",
        "Overview of company pages",
        "Car valuation",
      ],
    },
  ];

  return (
    <footer className="bg-white mt-1">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {footerColumns.map((col, i) => (
            <div key={i}>
              <h3 className="font-semibold text-gray-900 mb-4">{col.title}</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a href="#" className="hover:text-green-800 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-xs text-gray-500 space-y-1">
          <p>
            Copyright © 2005-2025 Marktplaats B.V. All rights reserved.
            Designated trademarks belong to their respective owners.
          </p>
          <p>The classifieds services are operated by kleinanzeigen.de GmbH.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
