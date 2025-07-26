// src/components/common/Navbar.jsx - The DEFINITIVE version for CLEAN URLs

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { FaFilter } from "react-icons/fa";
import { MdOutlineAddCircle } from "react-icons/md";
import { useSelector } from "react-redux";
import Slider from "rc-slider";
import { useDispatch } from "react-redux";
import {
  setPriceRange,
  setCondition,
  setRadius,
  setCity,
  setLocationFilter,
} from "../../slices/FilterSlice";
import "rc-slider/assets/index.css";
import { useTranslation } from "react-i18next";

// We'll use hardcoded URLs directly for backend calls as per your last request.
// If you want to use a config.js, add it back and use the variables.

const Navbar = ({ onLanguageChange, currentLanguage }) => {
  const { t, i18n } = useTranslation();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDropdownPinned, setIsDropdownPinned] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [localCondition, setLocalCondition] = useState("");
  const [localRadius, setLocalRadius] = useState(0);
  const [localSelectedCity, setLocalSelectedCity] = useState("");
  const [localPriceRange, setLocalPriceRange] = useState([0, 10000]);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const accessToken = localStorage.getItem("accessToken");

    if (storedName && accessToken) {
      setUserName(storedName);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8080/logout", { // Hardcoded backend URL
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userData");
      setUserName("");
      navigate(`/login`); // Navigate to flat path
    } catch (err) {
      console.error("Logout error:", err);
    }
  };
  const wishlist = useSelector((state) => state.wishlist.totalItems); // eslint-disable-line no-unused-vars

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setIsDropdownPinned(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNearbyClick = () => {
    if (!navigator.geolocation) {
      alert(t("navbar.geolocation_not_supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        dispatch(setLocationFilter({ latitude, longitude }));
        navigate(`/`); // Navigate to flat path
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert(t("navbar.allow_location_access"));
        } else {
          alert(t("navbar.unable_to_fetch_location"));
        }
        console.error(error);
      }
    );
  };

  const handleApplyFilters = () => {
    dispatch(setPriceRange(localPriceRange));
    dispatch(setCondition(localCondition));
    dispatch(setRadius(Number(localRadius)));
    dispatch(setCity(localSelectedCity));
    setShowFilter(false);
  };

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white">
        {/* Top Bar */}
        <div className="bg-white shadow-sm">
          <div className="max-w-[864px] mx-auto flex justify-between items-center px-4 py-4">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate(`/`)} // Navigate to flat path
            >
              <img src="/logo.svg" alt="logo" className="h-6 w-6" />
              <span className="text-2xl font-semibold text-[#2e4a2f]">
                {t("navbar.brand_name")}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Switcher - Calls onLanguageChange prop from App.jsx */}
              <div className="language-switcher mr-4">
                <button
                  onClick={() => onLanguageChange("en")} // This calls the prop from App.jsx
                  className={`text-sm font-medium px-2 py-1 rounded ${currentLanguage === "en" ? "bg-gray-200" : "text-gray-600"}`}
                >
                  EN
                </button>
                <button
                  onClick={() => onLanguageChange("az")} // This calls the prop from App.jsx
                  className={`text-sm font-medium px-2 py-1 rounded ${currentLanguage === "az" ? "bg-gray-200" : "text-gray-600"}`}
                >
                  AZ
                </button>
                <button
                  onClick={() => onLanguageChange("ru")} // This calls the prop from App.jsx
                  className={`text-sm font-medium px-2 py-1 rounded ${currentLanguage === "ru" ? "bg-gray-200" : "text-gray-600"}`}
                >
                  RU
                </button>
              </div>

              {!userName ? (
                <>
                  <button
                    className="border border-black text-black px-4 py-1 rounded-full text-sm"
                    onClick={() => navigate(`/register`)} // Navigate to flat path
                  >
                    {t("navbar.register")}
                  </button>
                  <span className="text-sm text-gray-500">{t("navbar.or")}</span>
                  <button
                    className="flex items-center gap-2 bg-lime-400 px-4 py-1 rounded-full text-sm font-medium"
                    onClick={() => navigate(`/login`)} // Navigate to flat path
                  >
                    <FaUser />
                    {t("navbar.login")}
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-green-900">
                    {t("navbar.hello", { name: userName })}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="border border-black text-black px-4 py-1 rounded-full text-sm"
                  >
                    {t("navbar.logout")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search & Icons Row */}
        <div className="bg-lime-400 py-4">
          <div className="max-w-[900px] mx-auto flex items-center justify-between gap-4 px-1">
            {/* Search Box */}
            <div className="flex bg-white rounded-full shadow px-4 h-12 w-full items-center gap-3">
              {/* Search Input */}
              <div className="flex items-center gap-2 w-[40%]">
                <FaSearch className="text-gray-500" />
                <input
                  type="text"
                  placeholder={t("navbar.search_placeholder")}
                  className="outline-none text-sm w-full"
                />
              </div>
              <button
                className="ml-2 p-2 bg-white rounded-full shadow hover:bg-gray-100"
                onClick={() => setShowFilter(true)}
                title={t("navbar.open_filters_title")}
              >
                <FaFilter className="text-lime-800" />
              </button>
              {/* Category Select */}
              <select className="text-sm text-gray-700 outline-none w-[25%] border-l pl-4">
                <option value="">{t("navbar.all_products")}</option>
                <option value="Cars & Motorcycles">{t("navbar.category_cars_motorcycles")}</option>
                <option value="Real Estate">{t("navbar.category_real_estate")}</option>
                <option value="Jobs">{t("navbar.category_jobs")}</option>
                <option value="Household & Furniture">{t("navbar.category_household_furniture")}</option>
                <option value="Electronics">{t("navbar.category_electronics")}</option>
                <option value="Leisure, Hobby & Neighborhood">{t("navbar.category_leisure_hobby")}</option>
                <option value="Service">{t("navbar.category_service")}</option>
              </select>

              {/* Location Input */}
              <div className="flex items-center gap-2 border-l border-gray-300 pl-4 w-[21%]">
                <FaMapMarkerAlt className="text-gray-500" />
                <input
                  type="text"
                  placeholder={t("navbar.postal_placeholder")}
                  className="outline-none text-sm w-full"
                />
              </div>

              {/* Disabled Input */}
              <input
                type="text"
                placeholder={t("navbar.whole_place_placeholder")}
                disabled
                className="text-sm text-gray-400 bg-gray-100 cursor-not-allowed w-[17%] px-1 py-1 rounded"
              />

              {/* Find Button */}
              <button className="ml-1 mx-0 bg-lime-500 hover:bg-lime-600 text-white font-semibold px-6 py-1.5 rounded-full">
                {t("navbar.find_button")}
              </button>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4 text-sm text-green-900 font-medium whitespace-nowrap">
              <div
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => navigate(`/form`)} // Navigate to flat path
              >
                <MdOutlineAddCircle className="text-lg" />
                {t("navbar.advertise_button")}
              </div>

              {/* Mine Dropdown */}
              <div ref={dropdownRef} className="relative">
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => {
                    setDropdownOpen((prev) => !prev);
                    setIsDropdownPinned((prev) => !prev);
                  }}
                >
                  <FaUser className="text-lg" />
                  <span>{t("navbar.mine_dropdown_label")}</span>
                </div>

                {(dropdownOpen || isDropdownPinned) && (
                  <div className="absolute top-full right-0 mt-2 w-40 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
                    {[
                      { labelKey: "navbar.news_link", path: "/chat" },
                      { labelKey: "navbar.show_link", path: "/userinfo" },
                      { labelKey: "navbar.settings_link", path: "/profile" },
                      { labelKey: "navbar.watchlist_link", path: "/watchlist" },
                      { labelKey: "navbar.users_link", path: "/userpage" },
                      { labelKey: "navbar.search_request_link", path: "/mysearch" },
                      { labelKey: "navbar.transactions_link", path: "/my/transactions" },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          navigate(`${item.path}`); // Navigate to flat path
                          setDropdownOpen(false);
                          setIsDropdownPinned(false);
                        }}
                      >
                        {t(item.labelKey)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative">
            <h2 className="text-lg font-semibold mb-4">{t("navbar.filter_listings_heading")}</h2>

            {/* Price Range Slider */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {t("navbar.price_range_label", { min: localPriceRange[0], max: localPriceRange[1] })}
              </label>
              <Slider
                range
                min={0}
                max={10000}
                step={100}
                value={localPriceRange}
                onChange={setLocalPriceRange}
                trackStyle={[{ backgroundColor: "#84cc16" }]}
                handleStyle={[
                  { borderColor: "#84cc16", backgroundColor: "#84cc16" },
                  { borderColor: "#84cc16", backgroundColor: "#84cc16" },
                ]}
                railStyle={{ backgroundColor: "#d1d5db" }}
              />
            </div>

            {/* Condition Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {t("navbar.condition_label")}
              </label>
              <select
                value={localCondition}
                onChange={(e) => setLocalCondition(e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">{t("navbar.select_option")}</option>
                <option value="new">{t("navbar.condition_new")}</option>
                <option value="like-new">{t("navbar.condition_like_new")}</option>
                <option value="used">{t("navbar.condition_used")}</option>
                <option value="defective">{t("navbar.condition_defective")}</option>
              </select>
            </div>

            {/* Radius Slider */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {t("navbar.radius_label", { radius: localRadius })}
              </label>
              <input
                type="range"
                min="0"
                max="400"
                step="10"
                value={localRadius}
                onChange={(e) => setLocalRadius(e.target.value)}
                className="w-full accent-lime-500"
              />
            </div>

            {/* City Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t("navbar.city_label")}</label>
              <select
                value={localSelectedCity}
                onChange={(e) => setLocalSelectedCity(e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">{t("navbar.select_city")}</option>
                <option value="baku">{t("navbar.city_baku")}</option>
                <option value="ganja">{t("navbar.city_ganja")}</option>
                <option value="sumqayit">{t("navbar.city_sumqayit")}</option>
                <option value="mingachevir">{t("navbar.city_mingachevir")}</option>
                <option value="shaki">{t("navbar.city_shaki")}</option>
                {/* Add all cities as needed with their translation keys */}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowFilter(false)}
                className="px-4 py-2 text-sm bg-gray-200 rounded"
              >
                {t("navbar.cancel_button")}
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 text-sm bg-lime-500 text-white rounded"
              >
                {t("navbar.apply_filters_button")}
              </button>
              <button
                className="bg-lime-600 text-white px-4 py-1.5 rounded-full text-sm hover:bg-lime-700"
                onClick={handleNearbyClick}
              >
                {t("navbar.nearby_products_button")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;