"use client"
import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { FaSearch, FaMapMarkerAlt, FaUser, FaBars, FaTimes } from "react-icons/fa"
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

        dispatch(setLocationFilter({ latitude, longitude })) // Fixed undeclared variable
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

  const handleSearch = () => {
    dispatch(setSearchQuery(searchInput))

    if (selectedCategory) {
      const englishCategory = t(selectedCategory, { lng: "en" })
      dispatch(setCategoryFilter(englishCategory))
    } else {
      dispatch(setCategoryFilter(""))
    }

    dispatch(setPostalCode(postalCode))
    navigate("/")
    setMobileMenuOpen(false) // Close mobile menu after search
  }

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white">
        {/* Top Bar */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
              <img src="/logo.svg" alt="logo" className="h-8 w-8" />
              <span className="text-2xl md:text-3xl font-semibold text-[#2e4a2f]">kleinanzeigen</span>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              {/* Global Display Language Selector */}
              <TextField
                select
                label={t("displayLanguage")}
                name="displayLanguage"
                value={i18n.language}
                onChange={handleDisplayLanguageChange}
                size="small"
                sx={{
                  minWidth: 120,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#2e4a2f" },
                    "&:hover fieldset": { borderColor: "#84cc16" },
                    "&.Mui-focused fieldset": { borderColor: "#84cc16" },
                  },
                  "& .MuiInputLabel-root": { color: "#2e4a2f" },
                  "& .MuiSelect-select": { color: "#2e4a2f" },
                  "& .MuiSvgIcon-root": { color: "#2e4a2f" },
                  marginRight: "1rem",
                }}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="az">Azərbaycan</MenuItem>
                <MenuItem value="ru">Русский</MenuItem>
              </TextField>

              {!userName ? (
                <>
                  <button
                    className="border border-black text-black px-6 py-2 rounded-full text-sm hover:bg-gray-100 transition-colors"
                    onClick={() => navigate("/register")}
                  >
                    {t("navbar.register")}
                  </button>
                  <span className="text-sm text-gray-500">{t("navbar.or")}</span>
                  <button
                    className="flex items-center gap-2 bg-lime-400 px-6 py-2 rounded-full text-sm font-medium hover:bg-lime-500 transition-colors"
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
                    className="border border-black text-black px-6 py-2 rounded-full text-sm hover:bg-gray-100 transition-colors"
                  >
                    {t("navbar.logout")}
                  </button>
                </>
              )}
            </div>

            <button className="lg:hidden p-2 text-[#2e4a2f]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 px-4 py-4">
            <div className="space-y-4">
              {/* Language Selector */}
              <TextField
                select
                label={t("displayLanguage")}
                name="displayLanguage"
                value={i18n.language}
                onChange={handleDisplayLanguageChange}
                size="small"
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#2e4a2f" },
                    "&:hover fieldset": { borderColor: "#84cc16" },
                    "&.Mui-focused fieldset": { borderColor: "#84cc16" },
                  },
                  "& .MuiInputLabel-root": { color: "#2e4a2f" },
                  "& .MuiSelect-select": { color: "#2e4a2f" },
                  "& .MuiSvgIcon-root": { color: "#2e4a2f" },
                }}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="az">Azərbaycan</MenuItem>
                <MenuItem value="ru">Русский</MenuItem>
              </TextField>

              {/* Auth buttons */}
              {!userName ? (
                <div className="flex flex-col gap-2">
                  <button
                    className="border border-black text-black px-4 py-2 rounded-full text-sm hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      navigate("/register")
                      setMobileMenuOpen(false)
                    }}
                  >
                    {t("navbar.register")}
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 bg-lime-400 px-4 py-2 rounded-full text-sm font-medium hover:bg-lime-500 transition-colors"
                    onClick={() => {
                      navigate("/login")
                      setMobileMenuOpen(false)
                    }}
                  >
                    <FaUser />
                    {t("navbar.login")}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-900">
                      {t("navbar.hello")}, {userName}
                    </span>
                    <NotificationBell />
                  </div>
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full border border-black text-black px-4 py-2 rounded-full text-sm hover:bg-gray-100 transition-colors"
                  >
                    {t("navbar.logout")}
                  </button>
                </div>
              )}

              {/* Mobile navigation items */}
              <div className="border-t pt-4 space-y-3">
                <button
                  className="flex items-center gap-2 text-green-900 font-medium w-full text-left"
                  onClick={() => {
                    navigate("/form")
                    setMobileMenuOpen(false)
                  }}
                >
                  <MdOutlineAddCircle className="text-lg" />
                  {t("navbar.advertise")}
                </button>

                {/* Mine dropdown items as individual buttons on mobile */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">{t("navbar.mine")}</div>
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
                      className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => {
                        navigate(item.path)
                        setMobileMenuOpen(false)
                      }}
                    >
                      {t(item.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-lime-400 py-6">
          <div className="max-w-7xl mx-auto px-6">
            <div className="hidden md:flex items-center justify-between gap-6">
              {/* Search Box */}
              <div className="flex bg-white rounded-full shadow-lg px-6 h-14 flex-1 max-w-4xl items-center gap-4">
                {/* Search Input */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FaSearch className="text-gray-500 flex-shrink-0 text-lg" />
                  <input
                    type="text"
                    placeholder={t("navbar.searchPlaceholder")}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSearch()
                      }
                    }}
                    className="outline-none text-base w-full min-w-0"
                  />
                </div>

                <button
                  className="ml-2 p-2.5 bg-white rounded-full shadow hover:bg-gray-100 cursor-pointer flex-shrink-0"
                  onClick={() => setShowFilter(true)}
                  title={t("navbar.openFiltersTitle")}
                >
                  <FaFilter className="text-lime-800 text-sm" />
                </button>

                {/* Category Select */}
                <select
                  className="text-base text-gray-700 outline-none border-l border-gray-300 pl-4 flex-shrink-0 min-w-[160px]"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">{t("navbar.allProducts")}</option>
                  <option value="navbar.category.carsMotorcycles">{t("navbar.category.carsMotorcycles")}</option>
                  <option value="navbar.category.realEstate">{t("navbar.category.realEstate")}</option>
                  <option value="navbar.category.jobs">{t("navbar.category.jobs")}</option>
                  <option value="navbar.category.householdFurniture">{t("navbar.category.householdFurniture")}</option>
                  <option value="navbar.category.electronics">{t("navbar.category.electronics")}</option>
                  <option value="navbar.category.leisureHobbyNeighborhood">
                    {t("navbar.category.leisureHobbyNeighborhood")}
                  </option>
                  <option value="navbar.category.service">{t("navbar.category.service")}</option>
                  <option value="navbar.category.other">{t("navbar.category.other")}</option>
                </select>

                {/* Postal Code Input */}
                <div className="flex items-center gap-3 border-l border-gray-300 pl-4 flex-shrink-0 min-w-[140px]">
                  <FaMapMarkerAlt className="text-gray-500 text-lg" />
                  <input
                    type="text"
                    placeholder={t("navbar.postalCodePlaceholder")}
                    value={postalCode}
                    onChange={(e) => setPostalCodeInput(e.target.value)}
                    className="outline-none text-base w-full min-w-0"
                  />
                </div>

                {/* Find Button */}
                <button
                  onClick={handleSearch}
                  className="ml-2 bg-lime-500 hover:bg-lime-600 text-white font-semibold px-8 py-2.5 rounded-full flex-shrink-0 text-base"
                >
                  {t("navbar.find")}
                </button>
              </div>

              {/* Icons */}
              <div className="flex items-center gap-6 text-base text-green-900 font-medium whitespace-nowrap">
                <div
                  className="flex items-center gap-2 cursor-pointer hover:text-lime-800 transition-colors"
                  onClick={() => navigate("/form")}
                >
                  <MdOutlineAddCircle className="text-xl" />
                  {t("navbar.advertise")}
                </div>

                {/* Mine Dropdown */}
                <div ref={dropdownRef} className="relative">
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:text-lime-800 transition-colors"
                    onClick={() => {
                      setDropdownOpen((prev) => !prev)
                      setIsDropdownPinned((prev) => !prev)
                    }}
                  >
                    <FaUser className="text-xl" />
                    <span>{t("navbar.mine")}</span>
                  </div>

                  {(dropdownOpen || isDropdownPinned) && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 z-50 py-2">
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
                            navigate(item.path)
                            setDropdownOpen(false)
                            setIsDropdownPinned(false)
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

            <div className="md:hidden space-y-3">
              {/* Search input */}
              <div className="flex bg-white rounded-full shadow px-4 h-12 items-center gap-3">
                <FaSearch className="text-gray-500" />
                <input
                  type="text"
                  placeholder={t("navbar.searchPlaceholder")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch()
                    }
                  }}
                  className="outline-none text-sm flex-1"
                />
                <button
                  className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
                  onClick={() => setShowFilter(true)}
                  title={t("navbar.openFiltersTitle")}
                >
                  <FaFilter className="text-lime-800" />
                </button>
              </div>

              {/* Category and location row */}
              <div className="flex gap-2">
                <select
                  className="flex-1 text-sm text-gray-700 outline-none bg-white rounded-full px-4 py-3 shadow"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">{t("navbar.allProducts")}</option>
                  <option value="navbar.category.carsMotorcycles">{t("navbar.category.carsMotorcycles")}</option>
                  <option value="navbar.category.realEstate">{t("navbar.category.realEstate")}</option>
                  <option value="navbar.category.jobs">{t("navbar.category.jobs")}</option>
                  <option value="navbar.category.householdFurniture">{t("navbar.category.householdFurniture")}</option>
                  <option value="navbar.category.electronics">{t("navbar.category.electronics")}</option>
                  <option value="navbar.category.leisureHobbyNeighborhood">
                    {t("navbar.category.leisureHobbyNeighborhood")}
                  </option>
                  <option value="navbar.category.service">{t("navbar.category.service")}</option>
                  <option value="navbar.category.other">{t("navbar.category.other")}</option>
                </select>

                <div className="flex items-center gap-2 bg-white rounded-full shadow px-4 py-3 flex-1">
                  <FaMapMarkerAlt className="text-gray-500" />
                  <input
                    type="text"
                    placeholder={t("navbar.postalCodePlaceholder")}
                    value={postalCode}
                    onChange={(e) => setPostalCodeInput(e.target.value)}
                    className="outline-none text-sm flex-1"
                  />
                </div>
              </div>

              {/* Find button */}
              <button
                onClick={handleSearch}
                className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-3 rounded-full"
              >
                {t("navbar.find")}
              </button>
            </div>
          </div>
        </div>
      </div>

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
