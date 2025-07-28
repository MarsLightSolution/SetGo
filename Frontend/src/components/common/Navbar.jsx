import Cookies from "js-cookie";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { FaFilter } from "react-icons/fa";
import { MdOutlineAddCircle } from "react-icons/md";
import { useSelector } from "react-redux";
import Slider from "rc-slider";
import { useDispatch } from "react-redux";
import {NotificationBell} from "./NotificationBell";
import { TextField, MenuItem } from "@mui/material"; // Import TextField and MenuItem for language selector
import {
  setPriceRange,
  setCondition,
  setRadius,
  setCity,
  setLocationFilter,
} from "../../slices/FilterSlice";
import "rc-slider/assets/index.css";

// i18n imports
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n'; // Adjust path if necessary based on your project structure

const Navbar = () => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDropdownPinned, setIsDropdownPinned] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [minPrice, setMinPrice] = useState(""); // This is not used in the JSX for prices, consider removing or integrating
  const [maxPrice, setMaxPrice] = useState(""); // This is not used in the JSX for prices, consider removing or integrating
  const [condition, setLocalCondition] = useState("");
  const [radius, setLocalRadius] = useState(0);
  const [selectedCity, setSelectedCity] = useState("");
  const [priceRange, setLocalPriceRange] = useState([0, 10000]);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8080/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userData");
      setUserName("");
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const wishlist = useSelector((state) => state.wishlist.totalItems);

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
      alert(t("geolocationNotSupported")); // Translated alert
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        dispatch(setLocationFilter({ latitude, longitude }));
        navigate("/");
        console.log("Location set:", latitude, longitude); // Keep for debugging if needed
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert(t("allowLocationAccess")); // Translated alert
        } else {
          alert(t("unableToFetchLocation")); // Translated alert
        }
        console.error(error);
      }
    );
  };

  // Handler for changing the display language
  const handleDisplayLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white">
        {/* Top Bar */}
        <div className="bg-white shadow-sm">
          <div className="max-w-[864px] mx-auto flex justify-between items-center px-4 py-4">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img src="/logo.svg" alt="logo" className="h-6 w-6" />
              <span className="text-2xl font-semibold text-[#2e4a2f]">
                kleinanzeigen
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Global Display Language Selector */}
              <TextField
                  select
                  label={t("displayLanguage")}
                  name="displayLanguage"
                  value={i18n.language}
                  onChange={handleDisplayLanguageChange}
                  size="small" // Make it smaller for navbar
                  sx={{
                      minWidth: 100, // Adjust width as needed
                      '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#2e4a2f' }, // Dark green border
                          '&:hover fieldset': { borderColor: '#84cc16' }, // Lime green on hover
                          '&.Mui-focused fieldset': { borderColor: '#84cc16' }, // Lime green when focused
                      },
                      '& .MuiInputLabel-root': { color: '#2e4a2f' }, // Dark green label
                      '& .MuiSelect-select': { color: '#2e4a2f' }, // Dark green text
                      '& .MuiSvgIcon-root': { color: '#2e4a2f' }, // Dark green dropdown icon
                      marginRight: '1rem', // Spacing from other buttons
                  }}
              >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="az">Azərbaycan</MenuItem>
                  <MenuItem value="ru">Русский</MenuItem>
              </TextField>

              {!userName ? (
                <>
                  <button
                    className="border border-black text-black px-4 py-1 rounded-full text-sm hover:bg-gray-100 transition-colors"
                    onClick={() => navigate("/register")}
                  >
                    {t("navbar.register")}
                  </button>
                  <span className="text-sm text-gray-500">{t("navbar.or")}</span>
                  <button
                    className="flex items-center gap-2 bg-lime-400 px-4 py-1 rounded-full text-sm font-medium hover:bg-lime-500 transition-colors"
                    onClick={() => navigate("/login")}
                  >
                    <FaUser />
                    {t("navbar.login")}
                  </button>
                </>
              ) : (
                <>
                  <NotificationBell />
                  <span className="text-sm font-medium text-green-900">
                    {t("navbar.hello")}, {userName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="border border-black text-black px-4 py-1 rounded-full text-sm hover:bg-gray-100 transition-colors"
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
                  placeholder={t("navbar.searchPlaceholder")} // Translated placeholder
                  className="outline-none text-sm w-full"
                />
              </div>
              <button
                className="ml-2 p-2 bg-white rounded-full shadow hover:bg-gray-100 cursor-pointer"
                onClick={() => setShowFilter(true)}
                title={t("navbar.openFiltersTitle")} // Translated title
              >
                <FaFilter className="text-lime-800" />
              </button>
              {/* Category Select */}
              <select className="text-sm text-gray-700 outline-none w-[25%] border-l pl-4">
                <option>{t("navbar.allProducts")}</option> {/* Translated option */}
                <option>{t("navbar.category.carsMotorcycles")}</option>
                <option>{t("navbar.category.realEstate")}</option>
                <option>{t("navbar.category.jobs")}</option>
                <option>{t("navbar.category.householdFurniture")}</option>
                <option>{t("navbar.category.electronics")}</option>
                <option>{t("navbar.category.leisureHobbyNeighborhood")}</option>
                <option>{t("navbar.category.service")}</option>
                <option>{t("navbar.category.other")}</option>
              </select>

              {/* Location Input */}
              <div className="flex items-center gap-2 border-l border-gray-300 pl-4 w-[21%]">
                <FaMapMarkerAlt className="text-gray-500" />
                <input
                  type="text"
                  placeholder={t("navbar.postalCodePlaceholder")} // Translated placeholder
                  className="outline-none text-sm w-full"
                />
              </div>

              {/* Disabled Input */}
              <input
                type="text"
                placeholder={t("navbar.wholePlacePlaceholder")} // Translated placeholder
                disabled
                className="text-sm text-gray-400 bg-gray-100 cursor-not-allowed w-[17%] px-1 py-1 rounded"
              />

              {/* Find Button */}
              <button className="ml-1 mx-0 bg-lime-500 hover:bg-lime-600 text-white font-semibold px-6 py-1.5 rounded-full">
                {t("navbar.find")} {/* Translated button */}
              </button>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4 text-sm text-green-900 font-medium whitespace-nowrap">
              <div
                className="flex items-center gap-1 cursor-pointer hover:text-lime-800 transition-colors"
                onClick={() => navigate("/form")}
              >
                <MdOutlineAddCircle className="text-lg" />
                {t("navbar.advertise")} {/* Translated text */}
              </div>

              {/* Mine Dropdown */}
              <div ref={dropdownRef} className="relative">
                <div
                  className="flex items-center gap-1 cursor-pointer hover:text-lime-800 transition-colors"
                  onClick={() => {
                    setDropdownOpen((prev) => !prev);
                    setIsDropdownPinned((prev) => !prev);
                  }}
                >
                  <FaUser className="text-lg" />
                  <span>{t("navbar.mine")}</span> {/* Translated text */}
                </div>

                {(dropdownOpen || isDropdownPinned) && (
                  <div className="absolute top-full right-0 mt-2 w-40 bg-white shadow-lg rounded-lg border border-gray-200 z-50 py-1"> {/* Added py-1 for padding */}
                    {[
                      { labelKey: "navbar.mineDropdown.news", path: "/chat" }, // Using labelKey for translation
                      { labelKey: "navbar.mineDropdown.show", path: "/userinfo" },
                      { labelKey: "navbar.mineDropdown.settings", path: "/profile" },
                      { labelKey: "navbar.mineDropdown.watchlist", path: "/watchlist" },
                      { labelKey: "navbar.mineDropdown.users", path: "/userpage" },
                      { labelKey: "navbar.mineDropdown.searchRequest", path: "/mysearch" },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          navigate(item.path);
                          setDropdownOpen(false);
                          setIsDropdownPinned(false);
                        }}
                      >
                        {t(item.labelKey)} {/* Use t() for item labels */}
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
            <h2 className="text-lg font-semibold mb-4">{t("navbar.filterListings")}</h2> {/* Translated heading */}

            {/* Price Range Slider */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {t("navbar.priceRange")}: ₹{priceRange[0]} – ₹{priceRange[1]}
              </label>
              <Slider
                range
                min={0}
                max={10000}
                step={100}
                value={priceRange}
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
                {t("navbar.condition")} {/* Translated label */}
              </label>
              <select
                value={condition}
                onChange={(e) => setLocalCondition(e.target.value)}
                className="w-full border rounded px-2 py-1 cursor-pointer"
              >
                <option value="">{t("navbar.select")}</option> {/* Translated option */}
                <option value="new">{t("navbar.conditionNew")}</option>
                <option value="like-new">{t("navbar.conditionLikeNew")}</option>
                <option value="used">{t("navbar.conditionUsed")}</option>
                <option value="defective">{t("navbar.conditionDefective")}</option>
              </select>
            </div>

            {/* Radius Slider */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {t("navbar.radius")}: {radius} km {/* Translated label */}
              </label>
              <input
                type="range"
                min="0"
                max="400"
                step="10"
                value={radius}
                onChange={(e) => setLocalRadius(e.target.value)}
                className="w-full accent-lime-500 cursor-pointer"
              />
            </div>

            {/* City Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t("navbar.city")}</label> {/* Translated label */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full border rounded px-2 py-1 cursor-pointer"
              >
                <option value="">{t("navbar.selectCity")}</option> {/* Translated option */}
                <option value="baku">{t("navbar.cityBaku")}</option>
                <option value="ganja">{t("navbar.cityGanja")}</option>
                <option value="sumqayit">{t("navbar.citySumqayit")}</option>
                <option value="mingachevir">{t("navbar.cityMingachevir")}</option>
                <option value="shaki">{t("navbar.cityShaki")}</option>
                {/* Add all cities as needed */}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowFilter(false)}
                className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                {t("navbar.cancel")} {/* Translated button */}
              </button>
              <button
                onClick={() => {
                  dispatch(setPriceRange(priceRange));
                  dispatch(setCondition(condition));
                  dispatch(setRadius(Number(radius)));
                  dispatch(setCity(selectedCity));
                  setShowFilter(false);
                }}
                className="px-4 py-2 text-sm bg-lime-500 text-white rounded hover:bg-lime-600 transition-colors"
              >
                {t("navbar.applyFilters")} {/* Translated button */}
              </button>
              <button
                className="bg-lime-600 text-white px-4 py-1.5 rounded-full text-sm hover:bg-lime-700 transition-colors"
                onClick={handleNearbyClick}
              >
                {t("navbar.nearbyProducts")} {/* Translated button */}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;