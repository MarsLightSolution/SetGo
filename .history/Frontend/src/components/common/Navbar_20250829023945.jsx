"use client"
import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { FaSearch, FaMapMarkerAlt, FaUser } from "react-icons/fa"
import { FaFilter } from "react-icons/fa"
import { MdOutlineAddCircle } from "react-icons/md"
import { IoMenu, IoClose } from "react-icons/io5"
import { useSelector, useDispatch } from "react-redux"
import NotificationBell from "./NotificationBell"
import ProductFilters from "./ProductFilters"
import { TextField, MenuItem } from "@mui/material"
import { setSearchQuery, setCategoryFilter, setPostalCode } from "../../slices/FilterSlice"

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

  const wishlist = useSelector((state) => state.wishlist?.totalItems)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const storedName = localStorage.getItem("userName")
    if (storedName) setUserName(storedName)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
        setIsDropdownPinned(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
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

  const handleNearbyClick = () => {
    if (!navigator.geolocation) {
      alert(t("geolocationNotSupported"))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        if (typeof setLocationFilter === "function") {
          dispatch(setLocationFilter({ latitude, longitude }))
        }
        navigate("/")
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

  const handleFind = () => {
    dispatch(setSearchQuery(searchInput))
    if (selectedCategory) {
      // Always send category to backend in English
      const englishCategory = t(selectedCategory, { lng: "en" })
      dispatch(setCategoryFilter(englishCategory))
    } else {
      dispatch(setCategoryFilter(""))
    }
    dispatch(setPostalCode(postalCode))
    navigate("/")
    if (mobileMenuOpen) setMobileMenuOpen(false)
  }

  const MineMenuItems = [
    { labelKey: "navbar.mineDropdown.news", path: "/chat" },
    { labelKey: "navbar.mineDropdown.show", path: "/userinfo" },
    { labelKey: "navbar.mineDropdown.settings", path: "/profile" },
    { labelKey: "navbar.mineDropdown.watchlist", path: "/watchlist" },
    { labelKey: "navbar.mineDropdown.users", path: "/userpage" },
    { labelKey: "navbar.mineDropdown.searchRequest", path: "/mysearch" },
  ]

  return (
    <>
      <header className="w-full sticky top-0 z-50 bg-white">
        {/* Top Bar */}
        <div className="bg-white shadow-sm">
          <div className="max-w-[1024px] mx-auto flex items-center justify-between px-4 py-3">
            {/* Logo */}
            <button
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
              aria-label={t("navbar.home") || "Home"}
            >
              <img src="/logo.svg" alt="logo" className="h-6 w-6" />
              <span className="text-2xl font-semibold text-[#2e4a2f]">kleinanzeigen</span>
            </button>

            {/* Right actions (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              {/* Global Display Language Selector */}
              <TextField
                select
                label={t("displayLanguage")}
                name="displayLanguage"
                value={i18n.language}
                onChange={handleDisplayLanguageChange}
                size="small"
                sx={{
                  minWidth: 110,
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
                    <FaUser aria-hidden />
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

            {/* Mobile: right controls */}
            <div className="md:hidden flex items-center gap-2">
              {/* Optional: show bell if logged in on mobile */}
              {userName ? <NotificationBell /> : null}
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-green-900 hover:bg-gray-100"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((s) => !s)}
              >
                {mobileMenuOpen ? <IoClose size={22} /> : <IoMenu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Search & Icons Row */}
        <div className="bg-lime-400 py-3">
          <div className="max-w-[1024px] mx-auto px-4">
            {/* Responsive Search Container */}
            <div className="bg-white shadow rounded-2xl md:rounded-full px-4 py-3 md:py-0 flex flex-col md:flex-row md:items-center gap-3">
              {/* Search Input */}
              <div className="flex items-center gap-2 w-full md:w-[40%] border-b md:border-0 pb-2 md:pb-0">
                <FaSearch className="text-gray-500" aria-hidden />
                <input
                  type="text"
                  placeholder={t("navbar.searchPlaceholder")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFind()
                  }}
                  className="outline-none text-sm w-full"
                  aria-label={t("navbar.searchPlaceholder")}
                />
              </div>

              {/* Filter trigger */}
              <div className="flex md:justify-center">
                <button
                  className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
                  onClick={() => setShowFilter(true)}
                  title={t("navbar.openFiltersTitle")}
                  aria-label={t("navbar.openFiltersTitle")}
                >
                  <FaFilter className="text-lime-800" aria-hidden />
                </button>
              </div>

              {/* Category Select */}
              <select
                className="text-sm text-gray-700 outline-none w-full md:w-[25%] md:border-l md:pl-4 border-t pt-2 md:border-t-0 md:pt-0"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label={t("navbar.allProducts")}
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
              <div className="flex items-center gap-2 w-full md:w-[21%] md:border-l md:pl-4 border-t pt-2 md:border-t-0 md:pt-0">
                <FaMapMarkerAlt className="text-gray-500" aria-hidden />
                <input
                  type="text"
                  placeholder={t("navbar.postalCodePlaceholder")}
                  value={postalCode}
                  onChange={(e) => setPostalCodeInput(e.target.value)}
                  className="outline-none text-sm w-full"
                  aria-label={t("navbar.postalCodePlaceholder")}
                />
              </div>

              {/* Find Button */}
              <div className="flex md:justify-end">
                <button
                  onClick={handleFind}
                  className="bg-lime-500 hover:bg-lime-600 text-white font-semibold px-6 py-2 rounded-full"
                >
                  {t("navbar.find")}
                </button>
              </div>
            </div>

            {/* Icons (desktop only) */}
            <div className="hidden md:flex items-center justify-end gap-6 text-sm text-green-900 font-medium whitespace-nowrap mt-3">
              <button
                className="flex items-center gap-1 hover:text-lime-800 transition-colors"
                onClick={() => navigate("/form")}
              >
                <MdOutlineAddCircle className="text-lg" aria-hidden />
                {t("navbar.advertise")}
              </button>

              {/* Mine Dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  className="flex items-center gap-1 hover:text-lime-800 transition-colors"
                  onClick={() => {
                    setDropdownOpen((prev) => !prev)
                    setIsDropdownPinned((prev) => !prev)
                  }}
                  aria-haspopup="menu"
                  aria-expanded={dropdownOpen || isDropdownPinned}
                >
                  <FaUser className="text-lg" aria-hidden />
                  <span>{t("navbar.mine")}</span>
                </button>

                {(dropdownOpen || isDropdownPinned) && (
                  <div
                    className="absolute top-full right-0 mt-2 w-44 bg-white shadow-lg rounded-lg border border-gray-200 z-50 py-1"
                    role="menu"
                  >
                    {MineMenuItems.map((item, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          navigate(item.path)
                          setDropdownOpen(false)
                          setIsDropdownPinned(false)
                        }}
                        role="menuitem"
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

        {/* Mobile Menu (auth, language, quick links) */}
        <div className={`${mobileMenuOpen ? "block" : "hidden"} md:hidden border-t bg-white`}>
          <div className="max-w-[1024px] mx-auto px-4 py-3 space-y-3">
            <TextField
              fullWidth
              select
              label={t("displayLanguage")}
              name="displayLanguage"
              value={i18n.language}
              onChange={handleDisplayLanguageChange}
              size="small"
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

            {!userName ? (
              <div className="flex items-center gap-2">
                <button
                  className="flex-1 border border-black text-black px-4 py-2 rounded-full text-sm hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    navigate("/register")
                    setMobileMenuOpen(false)
                  }}
                >
                  {t("navbar.register")}
                </button>
                <button
                  className="flex-1 bg-lime-400 px-4 py-2 rounded-full text-sm font-medium hover:bg-lime-500 transition-colors"
                  onClick={() => {
                    navigate("/login")
                    setMobileMenuOpen(false)
                  }}
                >
                  {t("navbar.login")}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-900">
                  {t("navbar.hello")}, {userName}
                </span>
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="border border-black text-black px-3 py-1 rounded-full text-sm hover:bg-gray-100 transition-colors"
                >
                  {t("navbar.logout")}
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-green-900 hover:bg-gray-50"
                onClick={() => {
                  navigate("/form")
                  setMobileMenuOpen(false)
                }}
              >
                <MdOutlineAddCircle className="text-lg" aria-hidden />
                {t("navbar.advertise")}
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-green-900 hover:bg-gray-50"
                onClick={handleNearbyClick}
              >
                <FaMapMarkerAlt className="text-lg" aria-hidden />
                {t("navbar.nearby") || "Nearby"}
              </button>
            </div>

            <nav aria-label="Mine menu">
              <div className="grid grid-cols-1 gap-1">
                {MineMenuItems.map((item, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm text-gray-700"
                    onClick={() => {
                      navigate(item.path)
                      setMobileMenuOpen(false)
                    }}
                  >
                    {t(item.labelKey)}
                  </button>
                ))}
              </div>
            </nav>
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
