"use client"

// Modern, responsive, mobile-first navbar with improved accessibility.
// Color system (4 colors total): primary emerald-600; neutrals: white, slate-700, slate-200.
// Typography: uses project fonts; layout is mobile-first with flex and gaps.

// NOTE: This is a drop-in refactor of your original Navbar with the same features,
// but with a modern, responsive layout and accessible interactions.
// Adjust import paths (NotificationBell, ProductFilters) to match your app.

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import Link from "next/link"

import { FaUser, FaSearch, FaMapMarkerAlt, FaBars } from "react-icons/fa"
import { FaFilter } from "react-icons/fa"
import { MdOutlineAddCircle } from "react-icons/md"

import NotificationBell from "./NotificationBell"
import ProductFilters from "./ProductFilters"
import "../i18n" // ensure i18n is initialized

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const router = useRouter()

  const [userName, setUserName] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showFilter, setShowFilter] = useState(false)

  const [searchInput, setSearchInput] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [postal, setPostal] = useState("")

  const dropdownRef = useRef(null)

  useEffect(() => {
    const storedName = typeof window !== "undefined" ? localStorage.getItem("userName") : ""
    if (storedName) setUserName(storedName)
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" })
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("userId")
        localStorage.removeItem("userName")
        localStorage.removeItem("userData")
      }
      setUserName("")
      router.push("/login")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  const onSubmitSearch = (e) => {
    e?.preventDefault?.()

    // In your app, dispatch Redux actions here. For preview, we log values.
    const englishCategory = selectedCategory ? t(selectedCategory, { lng: "en" }) : ""
    console.log("[v0] search", { q: searchInput, category: englishCategory, postal })

    router.push("/")
    setMobileOpen(false)
  }

  const handleDisplayLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value)
  }

  const menuItems = [
    { labelKey: "navbar.mineDropdown.news", path: "/chat" },
    { labelKey: "navbar.mineDropdown.show", path: "/userinfo" },
    { labelKey: "navbar.mineDropdown.settings", path: "/profile" },
    { labelKey: "navbar.mineDropdown.watchlist", path: "/watchlist" },
    { labelKey: "navbar.mineDropdown.users", path: "/userpage" },
    { labelKey: "navbar.mineDropdown.searchRequest", path: "/mysearch" },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 hover:text-emerald-600 md:hidden"
                aria-label="Open menu"
                onClick={() => setMobileOpen((v) => !v)}
              >
                <FaBars className="h-5 w-5" />
              </button>

              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <img src="/logo.svg" alt="Logo" className="h-7 w-7" />
                <span className="text-xl sm:text-2xl font-semibold text-emerald-700">kleinanzeigen</span>
              </Link>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center">
              <form
                onSubmit={onSubmitSearch}
                className="flex w-full max-w-3xl items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm"
                role="search"
                aria-label="Site search"
              >
                <div className="flex items-center gap-2 flex-[1.2]">
                  <FaSearch className="text-slate-500" />
                  <input
                    type="text"
                    placeholder={t("navbar.searchPlaceholder")}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSubmitSearch(e)}
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    aria-label={t("navbar.searchPlaceholder")}
                  />
                </div>

                <button
                  type="button"
                  className="rounded-full p-2 text-emerald-700 hover:bg-slate-100"
                  title={t("navbar.openFiltersTitle")}
                  onClick={() => setShowFilter(true)}
                  aria-label={t("navbar.openFiltersTitle")}
                >
                  <FaFilter />
                </button>

                <div className="flex items-center pl-3 border-l border-slate-200 flex-[0.9]">
                  <select
                    className="w-full bg-transparent text-sm text-slate-700 outline-none"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    aria-label={t("navbar.allProducts")}
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

                <div className="flex items-center gap-2 pl-3 border-l border-slate-200 flex-[0.7]">
                  <FaMapMarkerAlt className="text-slate-500" />
                  <input
                    type="text"
                    placeholder={t("navbar.postalCodePlaceholder")}
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    aria-label={t("navbar.postalCodePlaceholder")}
                  />
                </div>

                <button
                  type="submit"
                  className="ml-1 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  {t("navbar.find")}
                </button>
              </form>
            </div>

            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="lang">
                {t("displayLanguage")}
              </label>
              <select
                id="lang"
                name="displayLanguage"
                value={i18n.language}
                onChange={handleDisplayLanguageChange}
                className="hidden sm:block rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-emerald-300 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="az">Azərbaycan</option>
                <option value="ru">Русский</option>
              </select>

              {!userName ? (
                <>
                  <button
                    onClick={() => router.push("/register")}
                    className="hidden sm:inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {t("navbar.register")}
                  </button>
                  <button
                    onClick={() => router.push("/login")}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                  >
                    <FaUser />
                    <span className="hidden sm:inline">{t("navbar.login")}</span>
                  </button>
                </>
              ) : (
                <>
                  <NotificationBell />
                  <span className="hidden lg:inline text-sm font-medium text-emerald-700">
                    {t("navbar.hello")}, {userName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {t("navbar.logout")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="hidden md:block border-t border-slate-200">
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
            <div className="flex h-12 items-center justify-between text-sm text-slate-700">
              <button
                onClick={() => router.push("/form")}
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-600"
              >
                <MdOutlineAddCircle className="text-lg" />
                {t("navbar.advertise")}
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={dropdownOpen}
                  className="inline-flex items-center gap-2 hover:text-emerald-600"
                >
                  <FaUser className="text-lg" />
                  <span>{t("navbar.mine")}</span>
                </button>

                {dropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    {menuItems.map((item, idx) => (
                      <button
                        key={idx}
                        role="menuitem"
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          router.push(item.path)
                          setDropdownOpen(false)
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

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200">
            <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-3 space-y-3">
              <form onSubmit={onSubmitSearch} className="space-y-2" role="search">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <FaSearch className="text-slate-500" />
                  <input
                    type="text"
                    placeholder={t("navbar.searchPlaceholder")}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    aria-label={t("navbar.searchPlaceholder")}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:border-emerald-300"
                    onClick={() => setShowFilter(true)}
                    aria-label={t("navbar.openFiltersTitle")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <FaFilter className="text-emerald-700" />
                      {t("navbar.openFiltersTitle")}
                    </span>
                  </button>
                  <select
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    aria-label={t("navbar.allProducts")}
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

                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <FaMapMarkerAlt className="text-slate-500" />
                  <input
                    type="text"
                    placeholder={t("navbar.postalCodePlaceholder")}
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    aria-label={t("navbar.postalCodePlaceholder")}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  {t("navbar.find")}
                </button>
              </form>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    router.push("/form")
                    setMobileOpen(false)
                  }}
                  className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-600"
                >
                  <MdOutlineAddCircle className="text-lg" />
                  {t("navbar.advertise")}
                </button>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={dropdownOpen}
                    className="inline-flex items-center gap-2 hover:text-emerald-600"
                  >
                    <FaUser className="text-lg" />
                    <span>{t("navbar.mine")}</span>
                  </button>
                  {dropdownOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                    >
                      {menuItems.map((item, idx) => (
                        <button
                          key={idx}
                          role="menuitem"
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => {
                            router.push(item.path)
                            setDropdownOpen(false)
                            setMobileOpen(false)
                          }}
                        >
                          {t(item.labelKey)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="sr-only" htmlFor="lang-mobile">
                  {t("displayLanguage")}
                </label>
                <select
                  id="lang-mobile"
                  name="displayLanguage"
                  value={i18n.language}
                  onChange={handleDisplayLanguageChange}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option value="en">English</option>
                  <option value="az">Azərbaycan</option>
                  <option value="ru">Русский</option>
                </select>

                {!userName ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        router.push("/register")
                        setMobileOpen(false)
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {t("navbar.register")}
                    </button>
                    <button
                      onClick={() => {
                        router.push("/login")
                        setMobileOpen(false)
                      }}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                      {t("navbar.login")}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-emerald-700">
                      {t("navbar.hello")}, {userName}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {t("navbar.logout")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <ProductFilters
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={() => {
          setShowFilter(false)
          router.push("/")
        }}
      />
    </>
  )
}
