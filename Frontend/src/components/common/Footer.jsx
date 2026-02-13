import React from "react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  const footerColumns = [
    {
      title: t("footer.classifieds"),
      links: [
        t("footer.aboutUs"),
        t("footer.career"),
        t("footer.press"),
        t("footer.classifiedsMagazine"),
        t("footer.engagement"),
        t("footer.mobileApps"),
      ],
    },
    {
      title: t("footer.information"),
      links: [
        t("footer.help"),
        t("footer.tipsForYourSafety"),
        t("footer.childAndYourProtection"),
        t("footer.privacyPolicy"),
        t("footer.privacySettings"),
        t("footer.termsOfUse"),
      ],
    },
    {
      title: t("footer.forCompanies"),
      links: [
        t("footer.classifiedRealEstate"),
        t("footer.proInfopoint"),
        t("footer.proPackagesForCompanies"),
        t("footer.advertisingOnClassifieds"),
      ],
    },
    {
      title: t("footer.socialMedia"),
      links: [
        t("footer.facebook"),
        t("footer.youtube"),
        t("footer.instagram"),
        t("footer.threads"),
        t("footer.pinterest"),
        t("footer.tikTok"),
      ],
    },
    {
      title: t("footer.generally"),
      links: [
        t("footer.popularSearches"),
        t("footer.adsOverview"),
        t("footer.overviewOfCompanyPages"),
        t("footer.carValuation"),
      ],
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

    {/* Payment Methods */}
    <div className="border-t border-gray-200 mt-10 pt-6 flex flex-col items-center gap-3">
      <p className="text-xs text-gray-500 font-medium">We accept</p>
      <div className="flex items-center gap-4">
        {/* Visa Logo */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 500" className="h-8 w-auto">
          <rect width="780" height="500" rx="40" fill="#1a1f71" />
          <path d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8zM540.7 157.2c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.6-90.2 64.7-.3 28.2 26.6 43.9 46.9 53.3 20.8 9.6 27.8 15.8 27.7 24.4-.1 13.2-16.6 19.2-32 19.2-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.2 0 92.6-26.3 93-66.8.2-22.3-14-39.2-44.8-53.2-18.6-9.1-30.1-15.1-30-24.3 0-8.1 9.7-16.8 30.6-16.8 17.5-.3 30.1 3.5 40 7.5l4.8 2.3 7.3-42.8zM676.2 152.9h-41.3c-12.8 0-22.4 3.5-28 16.3l-79.4 179.5h56.2s9.2-24.2 11.3-29.5h68.6c1.6 6.9 6.5 29.5 6.5 29.5h49.7l-43.6-195.8zm-65.9 126.3c4.4-11.3 21.4-54.8 21.4-54.8-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47 12.4 56.6h-44.5zM259.3 152.9l-52.3 133.5-5.6-27.2c-9.7-31.2-39.9-65-73.7-81.9l47.9 171.1 56.6-.1 84.2-195.4h-57.1z" fill="#fff" />
          <path d="M146.9 152.9H59.6l-.7 4c67.1 16.2 111.5 55.4 129.9 102.5l-18.7-90.2c-3.2-12.4-12.8-15.9-23.2-16.3z" fill="#f9a533" />
        </svg>
        {/* Mastercard Logo */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 500" className="h-8 w-auto">
          <rect width="780" height="500" rx="40" fill="#16366f" />
          <circle cx="330" cy="250" r="150" fill="#d9222a" />
          <circle cx="450" cy="250" r="150" fill="#ee9f2d" />
          <path d="M390 130.7c-35.3 27.5-58 70.4-58 118.3s22.7 90.8 58 118.3c35.3-27.5 58-70.4 58-118.3s-22.7-90.8-58-118.3z" fill="#eb6100" />
        </svg>
      </div>
      <p className="text-xs text-gray-400">Payments processed securely via Azericard</p>
    </div>

    {/* Bottom Info */}
    <div className="border-t border-gray-200 mt-6 pt-6 text-center text-xs text-gray-500 space-y-2 px-4">
      <p>
        "SatGo is not responsible for the content of user-generated listings or third-party
advertisements displayed on the platform. All responsibility for the accuracy, legality,
quality, and safety of the listed products or services lies with the seller. SatGo's role is
limited to providing the platform and payment services as an intermediary, and we do
not guarantee or endorse any user content."
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
