"use client"
import { useEffect, useId, useMemo, useRef, useState } from "react"

function useLockBodyScroll(locked) {
  useEffect(() => {
    const { body } = document
    if (!body) return
    const previous = body.style.overflow
    if (locked) {
      body.style.overflow = "hidden"
    } else {
      body.style.overflow = previous || ""
    }
    return () => {
      body.style.overflow = previous || ""
    }
  }, [locked])
}

function useKeydown(targetKey, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e) => {
      if (e.key === targetKey) handler(e)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [targetKey, handler, enabled])
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [search, setSearch] = useState("")
  const menuId = useId()
  const searchInputRef = useRef(null)

  // Lock body scroll when mobile menu is open
  useLockBodyScroll(mobileOpen)

  // Close on ESC
  useKeydown(
    "Escape",
    () => {
      setMobileOpen(false)
    },
    mobileOpen,
  )

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 2)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Auto-focus search when opening mobile
  useEffect(() => {
    if (mobileOpen && searchInputRef.current) {
      try {
        searchInputRef.current.focus()
      } catch {}
    }
  }, [mobileOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: hook up your search action / navigation here
    // console.log("[v0] search:", search)
    setMobileOpen(false)
  }

  const primaryNav = useMemo(
    () => [
      { label: "Home", href: "#" },
      { label: "Shop", href: "#" },
      { label: "Deals", href: "#" },
      { label: "Categories", href: "#" },
      { label: "Support", href: "#" },
    ],
    [],
  )

  return (
    <header
      className={`sticky top-0 z-50 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 
      ${scrolled ? "shadow-sm" : "shadow-none"} transition-shadow duration-300`}
      role="banner"
    >
      {/* Top bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left - Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 lg:hidden transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls={menuId}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <svg
                className={`h-6 w-6 transition-transform duration-200 ${mobileOpen ? "rotate-90" : "rotate-0"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                {mobileOpen ? (
                  <path strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <a href="#" className="flex items-center gap-2" aria-label="Go to homepage">
              <span className="inline-block h-8 w-8 rounded bg-blue-600" aria-hidden="true" />
              <span className="font-semibold text-gray-900">ShopMate</span>
            </a>
          </div>

          {/* Center - Desktop Search */}
          <div className="hidden flex-1 px-6 lg:block">
            <form onSubmit={handleSubmit} role="search" aria-label="Site Search">
              <label htmlFor="desktop-search" className="sr-only">
                Search products
              </label>
              <div className="relative">
                <input
                  id="desktop-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
                />
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Submit search"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" strokeWidth="2" />
                    <path strokeWidth="2" strokeLinecap="round" d="M20 20l-3-3" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Right - Actions */}
          <nav className="ml-2 flex items-center gap-1 sm:gap-2" aria-label="Quick actions">
            <a
              href="#"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 lg:inline-block transition-colors"
            >
              Sign in
            </a>
            <a
              href="#"
              className="hidden rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 lg:inline-block transition-colors"
            >
              Register
            </a>
            <a
              href="#"
              className="rounded-md p-2 text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none" aria-hidden="true">
                <path
                  d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.172V11a6 6 0 1 0-12 0v3.172a2 2 0 0 1-.6 1.428L4 17h5"
                  strokeWidth="2"
                />
                <path d="M9 17a3 3 0 0 0 6 0" strokeWidth="2" />
              </svg>
            </a>
            <a href="#" className="rounded-md p-2 text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Cart">
              <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none" aria-hidden="true">
                <circle cx="8" cy="20" r="1.5" />
                <circle cx="17" cy="20" r="1.5" />
                <path
                  d="M2 3h2l2.5 12.5a2 2 0 0 0 2 1.5h8.6a2 2 0 0 0 2-1.5L22 7H6"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </a>
          </nav>
        </div>
      </div>

      {/* Desktop nav links */}
      <div className="hidden border-t border-gray-200 lg:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-6 py-3" aria-label="Primary">
            {primaryNav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/30 ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"} transition-opacity duration-200`}
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile panel */}
      <div
        id={menuId}
        className={`lg:hidden fixed inset-x-0 top-0 z-50 origin-top rounded-b-2xl bg-white shadow-sm ring-1 ring-black/5 
        ${mobileOpen ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0 pointer-events-none"} 
        transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div className="px-4 pt-3 pb-4 sm:px-6">
          {/* Mobile header row */}
          <div className="mb-2 flex items-center justify-between">
            <a href="#" className="flex items-center gap-2" aria-label="Go to homepage">
              <span className="inline-block h-7 w-7 rounded bg-blue-600" aria-hidden="true" />
              <span className="font-semibold text-gray-900">ShopMate</span>
            </a>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors"
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none" aria-hidden="true">
                <path strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile search */}
          <form onSubmit={handleSubmit} role="search" aria-label="Mobile Search" className="mb-3">
            <label htmlFor="mobile-search" className="sr-only">
              Search products
            </label>
            <div className="relative">
              <input
                id="mobile-search"
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Submit search"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" strokeWidth="2" />
                  <path strokeWidth="2" strokeLinecap="round" d="M20 20l-3-3" />
                </svg>
              </button>
            </div>
          </form>

          {/* Mobile links */}
          <nav className="grid gap-1" aria-label="Primary mobile">
            {primaryNav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Mobile account actions */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href="#"
              className="rounded-md px-3 py-2 text-center text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </a>
            <a
              href="#"
              className="rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Register
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
