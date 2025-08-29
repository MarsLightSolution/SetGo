"use client"

import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { FaSearch, FaMapMarkerAlt, FaUser } from "react-icons/fa"
import { FaFilter } from "react-icons/fa"
import { MdOutlineAddCircle } from "react-icons/md"
import { useSelector, useDispatch } from "react-redux"
import NotificationBell from "./NotificationBell"
import ProductFilters from "./ProductFilters"
import { TextField, MenuItem } from "@mui/material"
import {
  setSearchQuery,
  setCategoryFilter,
  setPostalCode,
  setLocationFilter, // added
} from "../../slices/FilterSlice"

// i18n imports
import { useTranslation } from "react-i18next"
import i18n from "../../i18n"

const Navbar = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [userName, setUserName] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isDropdownPinned, setIsDropdownPinned] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [postalCode, setPostalCodeInput] = useState("")

  useEffect(() => {
    const storedName = localStorage.getItem("userName")
    if (storedName) {
      setUserName(storedName)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_SERVER}/logout`, {
        method: "POST",
        credentials: "include",
      })
      localStorage.removeItem("accessToken")
      localStorage.removeItem("userId")
      localStorage.removeItem("userName")
      localStorage.removeItem("userData")
      setUserName("")
      navigate("/login")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  const wishlist = useSelector((state) => state.wishlist.totalItems)

  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
        setIsDropdownPinned(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleNearbyClick = () => {
    if (!navigator.geolocation) {
      alert(t("geolocationNotSupported"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        dispatch(setLocationFilter({ latitude, longitude })) // setLocationFilter used here
        navigate("/")
        console.log("Location set:", latitude, longitude)
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert(t("allowLocationAccess"))
        } else {
          alert(t("unableToFetchLocation"))
        }
        console.error(error)
      },
    )
  }

  const handleDisplayLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value)
  }

  return (
    <>
      <header
        className="w-full sticky top-0 z-50 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80"
        role="navigation"
        aria-label={t("navbar.navigationLabel")}
      >
        {/* Top Bar */}
        <div className="bg-white/0 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => navigate("/")}
              aria-label={t("navbar.goHome")}
            >
              <img src="/logo.svg" alt="logo" className="h-6 w-6" />
              <span className="text-xl md:text-2xl font-semibold text-[#2e4a2f] group-hover:opacity-90 transition-opacity">
                kleinanzeigen
              </span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Global Display Language Selector (hide on very small screens) */}
              <div className="hidden xs:block">
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
                    marginRight: "0.25rem",
                  }}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="az">Azərbaycan</MenuItem>
                  <MenuItem value="ru">Русский</MenuItem>
                </TextField>
              </div>

              {!userName ? (
                <>
                  <button
                    className="border border-black text-black px-3 sm:px-4 py-1 rounded-full text-sm hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
                    onClick={() => navigate("/register")}
                  >
                    {t("navbar.register")}
                  </button>
                  <span className="hidden sm:inline text-sm text-gray-500">{t("navbar.or")}</span>
                  <button
                    className="flex items-center gap-2 bg-lime-400 px-3 sm:px-4 py-1 rounded-full text-sm font-medium hover:bg-lime-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600 focus-visible:ring-offset-2"
                    onClick={() => navigate("/login")}
                  >
                    <FaUser aria-hidden="true" />
                    <span className="hidden xs:inline">{t("navbar.login")}</span>
                    <span className="sr-only">{t("navbar.login")}</span>
                  </button>
                </>
              ) : (
                <>
                  <NotificationBell />
                  <span className="hidden sm:inline text-sm font-medium text-green-900">
                    {t("navbar.hello")}, {userName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="border border-black text-black px-3 sm:px-4 py-1 rounded-full text-sm hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
                  >
                    {t("navbar.logout")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search & Icons Row */}
        <div className="bg-lime-400 py-3 md:py-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 px-2 sm:px-3 md:px-4">
            {/* Search Card */}
            <div className="bg-white rounded-2xl shadow px-3 sm:px-4 py-2.5 md:py-3 w-full">
              {/* Grid that collapses nicely on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
                {/* Search Input */}
                <label className="flex items-center gap-2 rounded-full border border-transparent focus-within:border-lime-300 transition-colors px-2 py-1.5 md:py-2">
                  <FaSearch className="text-gray-500" aria-hidden="true" />
                  <span className="sr-only">{t("navbar.searchPlaceholder")}</span>
                  <input
                    type="text"
                    placeholder={t("navbar.searchPlaceholder")}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        dispatch(setSearchQuery(searchInput))
                      }
                    }}
                    className="outline-none text-sm w-full placeholder:text-gray-400"
                  />
                </label>

                {/* Category Select */}
                <div className="flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 md:py-2">
                  <select
                    aria-label={t("navbar.allProducts")}
                    className="text-sm text-gray-700 outline-none w-full"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">{t("navbar.allProducts")}</option>
                    <option value="navbar.category.carsMotorcycles">{t("navbar.category.carsMotorcycles")}</option>
                    <option value="navbar.category.realEstate">{t("navbar.category.realEstate")}</option>
                    <option value="navbar.category.jobs">{t("navbar.category.jobs")}</option>
                    <option value="navbar.category.householdFurniture">
                      {t("navbar.category.householdFurniture")}
                    </option>
                    <option value="navbar.category.electronics">{t("navbar.category.electronics")}</option>
                    <option value="navbar.category.leisureHobbyNeighborhood">
                      {t("navbar.category.leisureHobbyNeighborhood")}
                    </option>
                    <option value="navbar.category.service">{t("navbar.category.service")}</option>
                    <option value="navbar.category.other">{t("navbar.category.other")}</option>
                  </select>
                </div>

                {/* Postal Code Input */}
                <label className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 md:py-2">
                  <FaMapMarkerAlt className="text-gray-500" aria-hidden="true" />
                  <span className="sr-only">{t("navbar.postalCodePlaceholder")}</span>
                  <input
                    type="text"
                    placeholder={t("navbar.postalCodePlaceholder")}
                    value={postalCode}
                    onChange={(e) => setPostalCodeInput(e.target.value)}
                    className="outline-none text-sm w-full placeholder:text-gray-400"
                  />
                </label>

                {/* Filters Button */}
                <div className="flex items-stretch">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 bg-white rounded-full border border-gray-200 px-3 py-1.5 md:py-2 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
                    onClick={() => setShowFilter(true)}
                    title={t("navbar.openFiltersTitle")}
                    aria-haspopup="dialog"
                  >
                    <FaFilter className="text-lime-800" aria-hidden="true" />
                    <span className="text-sm font-medium">{t("navbar.filters") || t("navbar.openFiltersTitle")}</span>
                  </button>
                </div>

                {/* Find Button */}
                <div className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(setSearchQuery(searchInput))
                      if (selectedCategory) {
                        const englishCategory = t(selectedCategory, { lng: "en" })
                        dispatch(setCategoryFilter(englishCategory))
                      } else {
                        dispatch(setCategoryFilter(""))
                      }
                      dispatch(setPostalCode(postalCode))
                      navigate("/")
                    }}
                    className="w-full bg-lime-500 hover:bg-lime-600 active:bg-lime-700 text-white font-semibold px-4 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-700 focus-visible:ring-offset-2"
                  >
                    {t("navbar.find")}
                  </button>
                </div>
              </div>
            </div>

            {/* Icons / Actions */}
            <div className="flex items-center gap-4 text-sm text-green-900 font-medium whitespace-nowrap md:whitespace-normal overflow-x-auto md:overflow-visible px-2 md:px-0">
              <button
                className="flex items-center gap-1 cursor-pointer hover:text-lime-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600 focus-visible:ring-offset-2 rounded"
                onClick={() => navigate("/form")}
              >
                <MdOutlineAddCircle className="text-lg" aria-hidden="true" />
                <span className="hidden sm:inline">{t("navbar.advertise")}</span>
                <span className="sr-only">{t("navbar.advertise")}</span>
              </button>

              {/* Mine Dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  className="flex items-center gap-1 cursor-pointer hover:text-lime-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600 focus-visible:ring-offset-2 rounded"
                  aria-expanded={dropdownOpen}
                  aria-controls="mine-menu"
                  onClick={() => {
                    setDropdownOpen((prev) => !prev)
                    setIsDropdownPinned((prev) => !prev)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setDropdownOpen(false)
                      setIsDropdownPinned(false)
                    }
                  }}
                >
                  <FaUser className="text-lg" aria-hidden="true" />
                  <span className="hidden sm:inline">{t("navbar.mine")}</span>
                  <span className="sr-only">{t("navbar.mine")}</span>
                </button>

                {(dropdownOpen || isDropdownPinned) && (
                  <div
                    id="mine-menu"
                    role="menu"
                    className="absolute top-full right-0 mt-2 w-44 bg-white shadow-lg rounded-lg border border-gray-200 z-50 py-1 transition ease-out duration-150 origin-top-right transform opacity-100 scale-100"
                  >
                    {[
                      { labelKey: "navbar.mineDropdown.news", path: "/chat" },
                      { labelKey: "navbar.mineDropdown.show", path: "/userinfo" },
                      { labelKey: "navbar.mineDropdown.settings", path: "/profile" },
                      { labelKey: "navbar.mineDropdown.watchlist", path: "/watchlist" },
                      { labelKey: "navbar.mineDropdown.users", path: "/userpage" },
                      { labelKey: "navbar.mineDropdown.searchRequest", path: "/mysearch" },
                    ].map((item, index) => (
                      <button
                        key={index}
                        role="menuitem"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => {
                          navigate(item.path)
                          setDropdownOpen(false)
                          setIsDropdownPinned(false)
                        }}
                      >
                        {t(item.labelKey)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <ProductFilters
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={() => {
          setShowFilter(false)
          navigate("/")
        }}
      />
    </>
  )
}

export default Navbar
