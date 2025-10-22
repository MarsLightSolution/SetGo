import React from "react";

const Footer = () => {
  const footerColumns = [
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
  ];

  return (
  <footer className="bg-white border-t border-gray-200 mt-5">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    {/* Responsive Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 text-center sm:text-left">
      {footerColumns.map((col, i) => (
        <div key={i}>
          <h3 className="font-semibold text-gray-900 mb-4 text-base">{col.title}</h3>
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

    {/* Bottom Info */}
    <div className="border-t border-gray-200 mt-10 pt-6 text-center text-xs text-gray-500 space-y-2 px-4">
      <p>
        “SatGo is not responsible for the content of user-generated listings or third-party
advertisements displayed on the platform. All responsibility for the accuracy, legality,
quality, and safety of the listed products or services lies with the seller. SatGo’s role is
limited to providing the platform and payment services as an intermediary, and we do
not guarantee or endorse any user content.”
      </p>
      <p>
        The classifieds services are operated by <span className="font-medium">SatGo</span>.
      </p>
    </div>
  </div>
</footer>

  );
};

export default Footer;
