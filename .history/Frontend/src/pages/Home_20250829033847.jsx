"use client"

import { useEffect, useState, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { like, unlike } from "../slices/wishSlice"
import { resetFilters, setCategoryFilter as setCategory } from "../slices/FilterSlice"
import Footer from "../components/common/Footer"
import { useNavigate } from "react-router-dom"
import bannerImage from "../assets/images/banner1.png"
import leftadImage from "../assets/images/ad01.png"
import rightadImage from "../assets/images/ad02.png"
import NotificationDemo from "../components/NotificationDemo"
import { useNotifications } from "../Hooks/useNotifications"
import {
  ImageIcon,
  Heart,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  MapPin,
  BadgeDollarSign,
  SlidersHorizontal,
  X,
} from "lucide-react"

import { useTranslation } from "react-i18next"
import i18n from "../i18n"

import { setProducts } from "../slices/productSlices"

// Color/Design policy:
// - Primary: emerald-600
// - Neutrals: white, gray, black
// - Accent: emerald-700 (hover); avoid additional brand colors to keep <=5 total

const getLocalizedText = (field) => {
  if (!field) return ""
  if (typeof field === "string") return field
  return field[i18n.language] || field.en || ""
}

const IconButton = ({ title, onClick, disabled, children }) => (
  <button
    title={title}
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
  >
    {children}
  </button>
)

const Chip = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 px-2.5 py-1 text-xs font-medium hover:bg-emerald-100 transition-colors"
  >
    {children}
  </button>
)

const LikeButton = ({ liked, onToggle }) => (
  <button
    onClick={onToggle}
    className="absolute top-2 right-2 cursor-pointer transition-transform duration-200 hover:scale-110"
    aria-label={liked ? "Unlike" : "Like"}
  >
    <Heart className={`w-5 h-5 ${liked ? "fill-rose-600 stroke-rose-600" : "stroke-gray-400"}`} />
  </button>
)

const AdCard = ({ ad, image, price }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { sendLikeNotification } = useNotifications()
  const { wishlist: likedAds } = useSelector((state) => state.wishlist)
  const liked = ad && likedAds.some((item) => item._id === ad._id)

  const currentDisplayLanguage = i18n.language
  const displayTitle =
    typeof ad?.title === "object" ? ad.title?.[currentDisplayLanguage] || ad.title?.en || "" : ad?.title || ""
  const displayLocation =
    typeof ad?.location === "object"
      ? ad.location?.postalCode?.[currentDisplayLanguage] || ad.location?.postalCode?.en || ""
      : ad?.postalCode || ad?.location || t("home.unknownLocation")

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

  const isAuthenticated = () => {
    const userId = localStorage.getItem("userId")
    const accessToken = localStorage.getItem("accessToken")
    return !!userId && !!accessToken
  }

  const handleLikeToggle = (e) => {
    e.stopPropagation()
    if (!isAuthenticated()) {
      alert(t("home.loginToLike"))
      return
    }
    if (!liked) {
      dispatch(like(ad))
      const productOwnerId = ad.owner?._id || ad.owner
      if (productOwnerId && productOwnerId !== localStorage.getItem("userId")) {
        const userName = localStorage.getItem("userName") || "Someone"
        const productTitle = getLocalizedText(ad.title) || t("home.yourItemPlaceholder")
        sendLikeNotification(productOwnerId, userName, productTitle, ad._id)
      }
    } else {
      dispatch(unlike(ad))
    }
  }

  const handleCardClick = () => {
    navigate(`products/product/${ad._id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="relative group cursor-pointer flex flex-col items-center justify-between border border-gray-200 shadow-sm hover:shadow-lg gap-3 p-3 rounded-xl w-[200px] bg-white transition-transform duration-300 hover:-translate-y-1"
    >
      {token && <LikeButton liked={liked} onToggle={handleLikeToggle} />}

      <div className="w-full h-[140px] flex justify-center items-center rounded-md overflow-hidden bg-gray-50">
        <img src={image || "/placeholder.svg"} alt={displayTitle} className="h-full w-full object-contain" />
      </div>

      <div className="w-full text-left space-y-1">
        <p className="truncate text-gray-800 font-semibold text-sm">{displayTitle}</p>
        <p className="text-gray-500 font-normal text-xs flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" /> {displayLocation}
        </p>
        <p className="text-emerald-700 font-bold text-sm flex items-center gap-1">
          <BadgeDollarSign className="w-4 h-4" /> ₼ {price}
        </p>
      </div>
    </div>
  )
}

const SectionWithAds = ({ titleKey, ads, pagination, onPageChange }) => {
  const { t } = useTranslation()

  return (
    <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mt-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{t(titleKey)}</h2>
        {ads.length > 0 && pagination && (
          <div className="flex items-center gap-3">
            <IconButton
              title={t("home.pagination.prev")}
              onClick={() => onPageChange((p) => ({ ...p, currentPage: pagination.prevPage }))}
              disabled={!pagination.hasPrevPage}
            >
              <ChevronLeft className="w-4 h-4" />
            </IconButton>
            <span className="text-sm text-gray-600">
              {t("home.pagination.pageOf", { currentPage: pagination.currentPage, totalPages: pagination.totalPages })}
            </span>
            <IconButton
              title={t("home.pagination.next")}
              onClick={() => onPageChange((p) => ({ ...p, currentPage: pagination.nextPage }))}
              disabled={!pagination.hasNextPage}
            >
              <ChevronRight className="w-4 h-4" />
            </IconButton>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
        {ads.map((ad, index) => (
          <AdCard
            key={ad._id || `ad-${index}`}
            ad={ad}
            image={
              ad.image ||
              `${import.meta.env.VITE_SERVER}/${ad.pictures?.[0]?.replace(/\\/g, "/") || "uploads/placeholder.jpg"}`
            }
            price={ad.price}
          />
        ))}
        {ads.length === 0 && <p className="text-gray-500 text-center w-full">{t("home.noAdsFound")}</p>}
      </div>
    </section>
  )
}

export default function Home() {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState(t("home.allProducts"))
  const { latestAds, recommendedAds } = useSelector((state) => state.products)
  const { priceRange, condition, radius, city, category, postalCode, latitude, longitude, searchQuery, location } =
    useSelector((state) => state.filter)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [latestPagination, setLatestPagination] = useState({ currentPage: 1 })
  const [recommendedPagination, setRecommendedPagination] = useState({ currentPage: 1 })

  const [galleryData, setGalleryData] = useState([])
  const [galleryLoading, setGalleryLoading] = useState(false)

  const hasActiveFilters = () =>
    (priceRange && priceRange[0] > 0) ||
    (priceRange && priceRange[1] < 10000) ||
    condition ||
    radius > 0 ||
    city ||
    searchQuery ||
    (location && location.latitude && location.longitude) ||
    category ||
    postalCode

  const clearFilters = () => dispatch(resetFilters())

  const categoryKeys = [
    "home.allProducts",
    "navbar.category.carsMotorcycles",
    "navbar.category.realEstate",
    "navbar.category.jobs",
    "navbar.category.householdFurniture",
    "navbar.category.electronics",
    "navbar.category.leisureHobbyNeighborhood",
    "navbar.category.service",
    "navbar.category.other",
  ]

  const fetchProducts = async (type, page) => {
    try {
      const params = new URLSearchParams({ page, limit: 12 })
      params.append("lang", i18n.language)
      const currentUserId = localStorage.getItem("userId")
      if (currentUserId) params.append("userId", currentUserId)
      if (priceRange && priceRange.length === 2) {
        params.append("minPrice", priceRange[0])
        params.append("maxPrice", priceRange[1])
      }
      if (location?.latitude && location?.longitude) {
        params.append("latitude", location.latitude)
        params.append("longitude", location.longitude)
        if (radius > 0) params.append("radiusInKm", radius)
      } else if (city) {
        params.append("city", city)
      }
      if (condition) params.append("condition", condition)
      if (category) params.append("category", category)
      if (postalCode) params.append("postalCode", postalCode)
      if (searchQuery) params.append("search", searchQuery)

      let endpoint = `${import.meta.env.VITE_SERVER}/api/products/getProducts`
      if (type === "nearby" && location?.latitude && location?.longitude && radius > 0) {
        endpoint = `${import.meta.env.VITE_SERVER}/api/products/nearby`
      }

      const res = await fetch(`${endpoint}?${params.toString()}`, { method: "GET", credentials: "include" })
      if (!res.ok) {
        console.error(t("home.fetchProductsError"))
        return
      }
      const json = await res.json()
      const { products = [], ...pagination } = json.data ?? {}

      if (type === "category") {
        dispatch(setProducts({ latestAds: products }))
        setLatestPagination(pagination)
      } else {
        dispatch(setProducts({ recommendedAds: products }))
        setRecommendedPagination(pagination)
      }
    } catch (err) {
      console.error(t("home.fetchFailed"), err)
    }
  }

  useEffect(() => {
    setActiveCategory(t("home.allProducts"))
    if (latitude && longitude) fetchProducts("nearby", 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, radius, t, i18n.language, dispatch])

  useEffect(() => {
    fetchProducts("category", latestPagination.currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeCategory,
    latestPagination.currentPage,
    priceRange,
    condition,
    city,
    searchQuery,
    radius,
    latitude,
    longitude,
    category,
    postalCode,
    t,
    i18n.language,
    dispatch,
  ])

  useEffect(() => {
    fetchProducts("recommended", recommendedPagination.currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    recommendedPagination.currentPage,
    priceRange,
    condition,
    city,
    searchQuery,
    radius,
    latitude,
    longitude,
    category,
    postalCode,
    t,
    i18n.language,
    dispatch,
  ])

  const fetchGalleryData = async () => {
    setGalleryLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/api/products/priority`, {
        method: "GET",
        credentials: "include",
      })
      if (!response.ok) {
        console.error("Failed to fetch gallery data")
        return
      }
      const result = await response.json()
      const products = result.data?.products || []
      const mappedProducts = products.map((product) => ({
        _id: product._id,
        title: product.title,
        location: product.location || product.postalCode || "Unknown Location",
        price: product.price,
        image: product.pictures?.[0]
          ? `${import.meta.env.VITE_SERVER}/${product.pictures[0].replace(/\\/g, "/")}`
          : "/images/placeholder.jpg",
        owner: product.owner,
      }))
      setGalleryData(mappedProducts)
    } catch (error) {
      console.error("Error fetching gallery data:", error)
    } finally {
      setGalleryLoading(false)
    }
  }

  useEffect(() => {
    fetchGalleryData()
  }, [])

  const navigateToProduct = (id) => navigate(`products/product/${id}`)

  const companyWebsites = [
    {
      name: { en: "Flipkart", az: "Flipkart", ru: "Flipkart" },
      description: {
        en: "Shop electronics, fashion, more",
        az: "Elektronika, moda və daha çox alış-veriş edin",
        ru: "Покупайте электронику, моду и многое другое",
      },
      image: "/images/flipkart.svg",
    },
    {
      name: { en: "Amazon", az: "Amazon", ru: "Amazon" },
      description: {
        en: "Online shopping destination",
        az: "Onlayn alış-veriş ünvanı",
        ru: "Место для онлайн-покупок",
      },
      image: "/images/amazon.png",
    },
    {
      name: { en: "Myntra", az: "Myntra", ru: "Myntra" },
      description: {
        en: "Fashion & lifestyle store",
        az: "Moda və həyat tərzi mağazası",
        ru: "Магазин моды и стиля жизни",
      },
      image: "/images/myntra.jpg",
    },
    {
      name: { en: "Snapdeal", az: "Snapdeal", ru: "Snapdeal" },
      description: {
        en: "Deals and discounts online",
        az: "Onlayn sövdələşmələr və endirimlər",
        ru: "Сделки и скидки онлайн",
      },
      image: "/images/snapdeal.png",
    },
    {
      name: { en: "Ajio", az: "Ajio", ru: "Ajio" },
      description: {
        en: "Trendy clothes and accessories",
        az: "Dəbli geyimlər və aksesuarlar",
        ru: "Модная одежда и аксессуары",
      },
      image: "/images/ajio.jpg",
    },
    {
      name: { en: "Reliance Digital", az: "Reliance Digital", ru: "Reliance Digital" },
      description: { en: "Electronics & gadgets", az: "Elektronika və cihazlar", ru: "Электроника и гадgets" },
      image: "/images/reliance.png",
    },
  ]

  const companyRef = useRef(null)
  const galleryRef = useRef(null)

  const scrollRef = (ref, direction) => {
    if (!ref.current) return
    const scrollAmount = direction === "left" ? -300 : 300
    ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-screen-xl px-4 flex flex-wrap gap-4 items-start">
          {/* Left Ad */}
          <aside className="hidden lg:block w-[160px] sticky top-[90px] h-fit z-30">
            <img
              src={leftadImage || "/placeholder.svg"}
              alt={t("home.leftAdAlt")}
              className="w-full h-[550px] object-cover rounded-xl shadow-sm"
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col gap-3 w-full lg:w-auto">
            {/* Banner */}
            <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-200">
              <img
                src={bannerImage || "/placeholder.svg"}
                alt={t("home.bannerAlt")}
                className="w-full h-[233px] object-cover"
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 z-10">
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg transition-colors">
                  {t("home.joinNow")}
                </button>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters() && (
              <div className="bg-white border border-emerald-100 rounded-xl p-4 mb-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-800 font-medium inline-flex items-center gap-1">
                      <SlidersHorizontal className="w-4 h-4" />
                      {t("home.activeFilters")}:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {priceRange && priceRange[0] > 0 && (
                        <Chip>
                          {t("home.minPrice")}: ₼ {priceRange[0]}
                        </Chip>
                      )}
                      {priceRange && priceRange[1] < 10000 && (
                        <Chip>
                          {t("home.maxPrice")}: ₼ {priceRange[1]}
                        </Chip>
                      )}
                      {condition && (
                        <Chip>
                          {t("home.condition")}: {condition}
                        </Chip>
                      )}
                      {city && (
                        <Chip>
                          {t("home.city")}: {city}
                        </Chip>
                      )}
                      {radius > 0 && <Chip>{t("home.radius", { val: radius })}</Chip>}
                      {location?.latitude && location?.longitude && <Chip>{t("home.locationBased")}</Chip>}
                      {searchQuery && (
                        <Chip>
                          {t("home.search")}: "{searchQuery}"
                        </Chip>
                      )}
                      {category && (
                        <Chip>
                          {"category"}: "{category}"
                        </Chip>
                      )}
                      {postalCode && (
                        <Chip>
                          {"postalCode"}: {postalCode}
                        </Chip>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 text-xs font-medium underline"
                  >
                    <X className="w-3.5 h-3.5" /> {t("home.clearAllFilters")}
                  </button>
                </div>
              </div>
            )}

            {/* Category + Gallery */}
            <div className="flex flex-wrap gap-4">
              {/* Categories */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 w-full md:w-[38%] h-[350px] overflow-y-auto shadow-sm">
                <h2 className="text-lg font-semibold mb-3 text-gray-900">{t("home.categories")}</h2>
                <ul className="text-sm space-y-3 pl-1 text-gray-700">
                  {categoryKeys.map((key) => {
                    const translatedCat = t(key)
                    const isActive = activeCategory === translatedCat
                    return (
                      <li key={key}>
                        <button
                          onClick={() => {
                            setActiveCategory(translatedCat)
                            if (key === "home.allProducts") {
                              dispatch(setCategory(""))
                            } else {
                              dispatch(setCategory(translatedCat))
                            }
                            setLatestPagination({ currentPage: 1 })
                            setRecommendedPagination({ currentPage: 1 })
                          }}
                          className={`w-full text-left px-2 py-2 rounded-md transition-colors ${
                            isActive ? "bg-emerald-50 text-emerald-700 font-semibold" : "hover:bg-gray-50"
                          }`}
                        >
                          {translatedCat}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Gallery */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex-1 w-full md:w-[60%] relative">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-emerald-600" /> {t("home.gallery")}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      onClick={fetchGalleryData}
                      disabled={galleryLoading}
                      title={t("home.refresh") || "Refresh Gallery"}
                    >
                      <RefreshCcw className={`w-3.5 h-3.5 ${galleryLoading ? "animate-spin" : ""}`} />
                      {galleryLoading ? t("home.loading") || "Loading" : t("home.refresh") || "Refresh"}
                    </button>
                    <IconButton title={t("home.scrollLeft")} onClick={() => scrollRef(galleryRef, "left")}>
                      <ChevronLeft className="w-4 h-4" />
                    </IconButton>
                    <IconButton title={t("home.scrollRight")} onClick={() => scrollRef(galleryRef, "right")}>
                      <ChevronRight className="w-4 h-4" />
                    </IconButton>
                  </div>
                </div>

                <div className="pointer-events-none absolute top-0 left-0 h-full w-6 bg-gradient-to-r from-white to-transparent rounded-l-2xl" />
                <div className="pointer-events-none absolute top-0 right-0 h-full w-6 bg-gradient-to-l from-white to-transparent rounded-r-2xl" />

                <div ref={galleryRef} className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar pb-2">
                  {galleryLoading ? (
                    <div className="flex items-center justify-center w-full h-[200px]">
                      <div className="animate-pulse text-gray-500">{t("home.loading") || "Loading gallery..."}</div>
                    </div>
                  ) : galleryData.length > 0 ? (
                    galleryData.map((item, index) => (
                      <div
                        key={item._id || index}
                        onClick={() => navigateToProduct(item._id)}
                        className="min-w-[180px] max-w-[200px] flex-shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden"
                      >
                        {/* Icon frame */}
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur rounded-full p-1 shadow">
                          <ImageIcon className="w-4 h-4 text-emerald-600" />
                        </div>

                        {/* Image */}
                        <div className="w-full h-[150px] bg-gray-50 flex justify-center items-center overflow-hidden">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={
                              typeof item.title === "object" ? item.title[i18n.language] || item.title.en : item.title
                            }
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Content */}
                        <div className="p-3 space-y-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {typeof item.title === "object" ? item.title[i18n.language] || item.title.en : item.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {typeof item.location === "object"
                              ? item.location[i18n.language] || item.location.en
                              : item.location}
                          </p>
                          <p className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                            <BadgeDollarSign className="w-4 h-4" /> ₼ {item.price}
                          </p>
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center w-full h-[200px]">
                      <p className="text-gray-500">{t("home.noAdsFound") || "No products found"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <SectionWithAds
              titleKey="home.latestAds"
              ads={latestAds}
              pagination={latestPagination}
              onPageChange={setLatestPagination}
            />

            <SectionWithAds
              titleKey="home.recommendedForYou"
              ads={recommendedAds}
              pagination={recommendedPagination}
              onPageChange={setRecommendedPagination}
            />

            <SectionWithAds
              titleKey="home.nearbyProductsAroundYou"
              ads={recommendedAds}
              pagination={recommendedPagination}
              onPageChange={setRecommendedPagination}
            />

            {/* Company Websites */}
            <section className="bg-white p-4 mt-3 rounded-2xl shadow-sm border border-gray-200 relative">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{t("home.companyWebsites")}</h2>
                <div className="flex gap-2">
                  <IconButton title={t("home.scrollLeft")} onClick={() => scrollRef(companyRef, "left")}>
                    <ChevronLeft className="w-4 h-4" />
                  </IconButton>
                  <IconButton title={t("home.scrollRight")} onClick={() => scrollRef(companyRef, "right")}>
                    <ChevronRight className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>

              <div className="pointer-events-none absolute top-0 left-0 h-full w-6 bg-gradient-to-r from-white to-transparent rounded-l-2xl" />
              <div className="pointer-events-none absolute top-0 right-0 h-full w-6 bg-gradient-to-l from-white to-transparent rounded-r-2xl" />

              <div ref={companyRef} className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar pb-2">
                {companyWebsites.map((site, index) => (
                  <div
                    key={index}
                    className="w-[220px] bg-white border border-gray-200 rounded-xl shadow-sm flex-shrink-0 transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="w-full h-[140px] bg-white flex justify-center items-center">
                      {site.image ? (
                        <img
                          src={site.image || "/placeholder.svg"}
                          alt={site.name[i18n.language] || site.name.en}
                          className="h-[90px] object-contain"
                        />
                      ) : (
                        <span className="text-sm text-gray-400">{t("home.logoNumber", { number: index + 1 })}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900">{site.name[i18n.language] || site.name.en}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {site.description[i18n.language] || site.description.en}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>

          {/* Right Ad */}
          <aside className="hidden lg:block w-[160px] sticky top-[90px] h-fit z-30">
            <img
              src={rightadImage || "/placeholder.svg"}
              alt={t("home.rightAdAlt")}
              className="w-full h-[550px] object-cover rounded-xl shadow-sm"
            />
          </aside>
        </div>
      </div>

      {/* Notification Demo */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <NotificationDemo />
      </div>

      <Footer />
    </div>
  )
}
