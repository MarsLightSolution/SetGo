import React from "react";
import { useNavigate } from "react-router-dom";
import EmptySearchImage from "../assets/images/binocular.png";
import Footer from "../components/common/Footer";

// i18n import
import { useTranslation } from 'react-i18next';

const MySearch = () => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f6f6f6] text-black flex flex-col">
      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="bg-white w-full rounded-md shadow-md px-6 py-4 text-center">
          <h2 className="text-2xl font-bold text-left mb-4">{t("mySearch.mainTitle")}</h2> {/* Translated */}

          <div className="flex flex-col items-center gap-3">
            <img
              src={EmptySearchImage}
              alt={t("mySearch.emptySearchAlt")} // Translated
              className="w-28 h-28"
            />
            <h3 className="text-lg font-semibold">
              {t("mySearch.noSuitableFoundTitle")} {/* Translated */}
            </h3>
            <p className="text-sm text-gray-600 max-w-md">
              {t("mySearch.saveSearchInstructions")} {/* Translated */}
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-lime-500 hover:bg-lime-600 text-white px-6 py-2 rounded-full mt-1 font-semibold cursor-pointer"
            >
              {t("mySearch.browseAdsButton")} {/* Translated */}
            </button>
          </div>
        </div>
      </div>

      {/* Footer placed outside the flexed content */}
      <Footer />
    </div>
  );
};

export default MySearch;