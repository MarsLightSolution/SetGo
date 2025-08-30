import Cookies from "js-cookie";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaMapMarkerAlt, FaUser, FaBars   } from "react-icons/fa";
import { FaFilter, FaTimes, FaSignOutAlt } from "react-icons/fa";
import { MdOutlineAddCircle } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import NotificationBell from "./NotificationBell";
import ProductFilters from "./ProductFilters";
import { TextField, MenuItem } from "@mui/material"; 
import logo from "../../assets/images/logo.png"; // Adjust the path as necessary
import {
  setSearchQuery,
  setCategoryFilter,
  setPostalCode,
} from "../../slices/FilterSlice";

// i18n imports
import { useTranslation } from "react-i18next";
import i18n from "../../i18n"; 

const Navbar = () => {
  const { t } = useTranslation(); 
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDropdownPinned, setIsDropdownPinned] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [postalCode, setPostalCodeInput] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_SERVER}/logout`, {
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
      alert(t("geolocationNotSupported")); 
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        dispatch(setLocationFilter({ latitude, longitude }));
        navigate("/");
        console.log("Location set:", latitude, longitude);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert(t("allowLocationAccess")); 
        } else {
          alert(t("unableToFetchLocation")); 
        }
        console.error(error);
      }
    );
  };

  const handleDisplayLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white">
{/* Top Bar */}
<div className="bg-white shadow-sm">
  <div className="max-w-[864px] mx-auto flex justify-between items-center px-4 py-3">
    {/* Logo */}
    <div
      className="flex items-center space-x-2 cursor-pointer"
      onClick={() => navigate("/")}
    >
      <img src={logo} alt="logo" className="h-10 w-10" />
      {/* Always show full text */}
      <span className="text-xl sm:text-2xl font-semibold text-[#2e4a2f]">
        SATGOO
      </span>
    </div>

    {/* Right Section */}
    <div className="flex items-center gap-3">
      {/* Global Display Language Selector (tablet/desktop) */}
      <div className="hidden sm:block">
        <TextField
          select
          label={t("displayLanguage")}
          name="displayLanguage"
          value={i18n.language}
          onChange={handleDisplayLanguageChange}
          size="small"
          sx={{
            minWidth: 100,
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "#2e4a2f" },
              "&:hover fieldset": { borderColor: "#84cc16" },
              "&.Mui-focused fieldset": { borderColor: "#84cc16" },
            },
            "& .MuiInputLabel-root": { color: "#2e4a2f" },
            "& .MuiSelect-select": { color: "#2e4a2f" },
            "& .MuiSvgIcon-root": { color: "#2e4a2f" },
            marginRight: "0.5rem",
          }}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="az">Azərbaycan</MenuItem>
          <MenuItem value="ru">Русский</MenuItem>
        </TextField>
      </div>

      {/* Mobile Language Selector */}
      <div className="sm:hidden">
        <select
          value={i18n.language}
          onChange={(e) => handleDisplayLanguageChange(e)}
          className="border border-gray-300 rounded px-2 py-1 text-sm text-[#2e4a2f]"
        >
          <option value="en">EN</option>
          <option value="az">AZ</option>
          <option value="ru">RU</option>
        </select>
      </div>

      {!userName ? (
        <>
          {/* Logged OUT → Show Register + Login (both visible on mobile & desktop) */}
          <div className="flex items-center gap-2">
            <button
              className="border border-black text-black px-3 sm:px-4 py-1 rounded-full text-sm hover:bg-gray-100 transition-colors"
              onClick={() => navigate("/register")}
            >
              {t("navbar.register")}
            </button>

           <button
  className="bg-lime-400 px-4 py-1 rounded-full text-sm font-medium hover:bg-lime-500 transition-colors"
  onClick={() => navigate("/login")}
>
  <span className="hidden sm:block">{t("navbar.login")}</span>
  <span className="sm:hidden flex items-center gap-1">
    <FaUser /> {t("navbar.login")}
  </span>
</button>

          </div>
        </>
      ) : (
        <>
          {/* Logged IN → Bell + Greeting + Logout */}
          <NotificationBell />
          <span className="hidden sm:block text-sm font-medium text-green-900">
            {t("navbar.hello")}, {userName}
          </span>

          {/* Logout → Icon on Mobile, Button on Desktop */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center border border-black text-black px-2 sm:px-4 py-1 rounded-full text-sm hover:bg-gray-100 transition-colors"
          >
            <FaSignOutAlt className="sm:hidden text-lg" />
            <span className="hidden sm:block">{t("navbar.logout")}</span>
          </button>
        </>
      )}
    </div>
  </div>
</div>
     {/* Green Search & Icons Row */}
<div className="bg-lime-400 py-4">
  <div className="max-w-[900px] mx-auto flex items-center justify-between gap-4 px-2">
    
    {/* LEFT: Search Box (Desktop) */}
    <div className="hidden md:flex bg-white rounded-full shadow px-4 h-12 w-full items-center gap-3">
      {/* Search Input */}
      <div className="flex items-center gap-2 w-[40%]">
        <FaSearch className="text-gray-500" />
        <input
          type="text"
          placeholder={t("navbar.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              dispatch(setSearchQuery(searchInput));
            }
          }}
          className="outline-none text-sm w-full"
        />
      </div>

      {/* Filter Button */}
      <button
        className="ml-2 p-2 bg-white rounded-full shadow hover:bg-gray-100 cursor-pointer"
        onClick={() => setShowFilter(true)}
        title={t("navbar.openFiltersTitle")}
      >
        <FaFilter className="text-lime-800" />
      </button>

      {/* Category Select */}
      <select
        className="text-sm text-gray-700 outline-none w-[25%] border-l pl-4"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="">{t("navbar.allProducts")}</option>
        <option value="navbar.category.carsMotorcycles">{t("navbar.category.carsMotorcycles")}</option>
        <option value="navbar.category.realEstate">{t("navbar.category.realEstate")}</option>
        <option value="navbar.category.jobs">{t("navbar.category.jobs")}</option>
        <option value="navbar.category.householdFurniture">{t("navbar.category.householdFurniture")}</option>
        <option value="navbar.category.electronics">{t("navbar.category.electronics")}</option>
        <option value="navbar.category.leisureHobbyNeighborhood">{t("navbar.category.leisureHobbyNeighborhood")}</option>
        <option value="navbar.category.service">{t("navbar.category.service")}</option>
        <option value="navbar.category.other">{t("navbar.category.other")}</option>
      </select>

      {/* Postal Code Input */}
      <div className="flex items-center gap-2 border-l border-gray-300 pl-4 w-[21%]">
        <FaMapMarkerAlt className="text-gray-500" />
        <input
          type="text"
          placeholder={t("navbar.postalCodePlaceholder")}
          value={postalCode}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            if (value.length <= 6) setPostalCodeInput(value);
          }}
          maxLength={6}
          className="outline-none text-sm w-full"
        />
      </div>

      {/* Find Button */}
      <button
        onClick={() => {
          dispatch(setSearchQuery(searchInput));
          if (selectedCategory) {
            const englishCategory = t(selectedCategory, { lng: "en" });
            dispatch(setCategoryFilter(englishCategory));
          } else {
            dispatch(setCategoryFilter(""));
          }
          dispatch(setPostalCode(postalCode));
          navigate("/");
        }}
        className="ml-1 mx-0 bg-lime-500 hover:bg-lime-600 text-white font-semibold px-6 py-1.5 rounded-full"
      >
        {t("navbar.find")}
      </button>

      {/* Clear Button */}
      {(searchInput || selectedCategory || postalCode) && (
        <button
          onClick={() => {
            setSearchInput("");
            setSelectedCategory("");
            setPostalCodeInput("");
            dispatch(setSearchQuery(""));
            dispatch(setCategoryFilter(""));
            dispatch(setPostalCode(""));
            navigate("/");
          }}
          className="ml-2 p-2 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-700"
          title={t("Clear")}
        >
          <FaTimes />
        </button>
      )}
    </div>

    {/* LEFT: Search Icon (Mobile Only) */}
    <div className="flex md:hidden ml-2">
      <button
        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
        className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
      >
        <FaSearch className="text-lime-800 text-lg" />
      </button>
    </div>

    {/* RIGHT: Buttons (always visible) */}
    <div className="flex items-center gap-4 text-sm text-green-900 font-medium whitespace-nowrap">
      <div
        className="flex items-center gap-1 cursor-pointer hover:text-lime-800 transition-colors"
        onClick={() => navigate("/form")}
      >
        <MdOutlineAddCircle className="text-lg" />
        {t("navbar.advertise")}
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
          <span>{t("navbar.mine")}</span>
        </div>

        {(dropdownOpen || isDropdownPinned) && (
          <div className="absolute top-full right-0 mt-2 w-40 bg-white shadow-lg rounded-lg border border-gray-200 z-50 py-1">
            {[
              { labelKey: "navbar.mineDropdown.news", path: "/chat" },
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
                {t(item.labelKey)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dashboard */}
      <div
        className="flex items-center gap-1 cursor-pointer hover:text-lime-800 transition-colors"
        onClick={() => navigate("/dashboard")}
      >
        <FaBars className="text-lg" />
        <span>{t("Dashboard")}</span>
      </div>
    </div>
  </div>

  {/* DROPDOWN Search for Mobile */}
  {mobileSearchOpen && (
    <div className="md:hidden mt-3 px-3">
      <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
            <button
        onClick={() => setMobileSearchOpen(false)}
        className="absolute top-26 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
      >
        ×
      </button>
        {/* Search Input */}
        <div className="flex items-center gap-2 border-b pb-2">
          <FaSearch className="text-gray-500" />
          <input
            type="text"
            placeholder={t("navbar.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                dispatch(setSearchQuery(searchInput));
              }
            }}
            className="outline-none text-sm w-full"
          />
        </div>

        {/* Filter Button */}
        <button
          className="flex items-center gap-2 text-lime-800 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200"
          onClick={() => setShowFilter(true)}
        >
          <FaFilter /> {t("navbar.openFiltersTitle")}
        </button>

        {/* Category Select */}
        <select
          className="text-sm text-gray-700 outline-none border p-2 rounded-lg"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">{t("navbar.allProducts")}</option>
          <option value="navbar.category.carsMotorcycles">{t("navbar.category.carsMotorcycles")}</option>
          <option value="navbar.category.realEstate">{t("navbar.category.realEstate")}</option>
          <option value="navbar.category.jobs">{t("navbar.category.jobs")}</option>
          <option value="navbar.category.householdFurniture">{t("navbar.category.householdFurniture")}</option>
          <option value="navbar.category.electronics">{t("navbar.category.electronics")}</option>
          <option value="navbar.category.leisureHobbyNeighborhood">{t("navbar.category.leisureHobbyNeighborhood")}</option>
          <option value="navbar.category.service">{t("navbar.category.service")}</option>
          <option value="navbar.category.other">{t("navbar.category.other")}</option>
        </select>

        {/* Postal Code Input */}
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1">
          <FaMapMarkerAlt className="text-gray-500" />
          <input
            type="text"
            placeholder={t("navbar.postalCodePlaceholder")}
            value={postalCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 6) setPostalCodeInput(value);
            }}
            maxLength={6}
            className="outline-none text-sm w-full"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              dispatch(setSearchQuery(searchInput));
              if (selectedCategory) {
                const englishCategory = t(selectedCategory, { lng: "en" });
                dispatch(setCategoryFilter(englishCategory));
              } else {
                dispatch(setCategoryFilter(""));
              }
              dispatch(setPostalCode(postalCode));
              navigate("/");
              setMobileSearchOpen(false);
            }}
            className="flex-1 bg-lime-500 hover:bg-lime-600 text-white font-semibold px-4 py-2 rounded-lg"
          >
            {t("navbar.find")}
          </button>

          {(searchInput || selectedCategory || postalCode) && (
            <button
              onClick={() => {
                setSearchInput("");
                setSelectedCategory("");
                setPostalCodeInput("");
                dispatch(setSearchQuery(""));
                dispatch(setCategoryFilter(""));
                dispatch(setPostalCode(""));
                navigate("/");
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700"
              title={t("Clear")}
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>
    </div>
  )}
</div>


      </div>

      <ProductFilters
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={() => {
          setShowFilter(false);
          navigate("/");
        }}
      />
    </>
  );
};

export default Navbar;
