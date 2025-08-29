"use client"

import { useEffect, useState, useRef } from "react"
import { Favorite, FavoriteBorder } from "@mui/icons-material"
import { useDispatch, useSelector } from "react-redux"
import { like, unlike } from "../slices/wishSlice"
import { resetFilters, setCategoryFilter as setCategory } from "../slices/FilterSlice"
import Footer from "../components/common/Footer"
import { useNavigate } from "react-router-dom"
import bannerImage from "../assets/images/banner1.png"
import leftadImage from "../assets/images/ad01.png"
import rightadImage from "../assets/images/ad02.png"
import { useNotifications } from "../Hooks/useNotifications"
import { Image as ImageIcon } from "lucide-react"; // <-- add lucide-react icon
import { motion } from "framer-motion"
import { Image as RefreshCw, ArrowLeft, ArrowRight, Tag, Package } from "lucide-react"


<Package className="w-6 h-6 text-green-600" />
import { useTranslation } from "react-i18next"
import i18n from "../i18n"

import { setProducts } from "../slices/productSlices"

const getLocalizedText = (field) => {
  if (!field) return ""
  if (typeof field === "string") return field
  return field[i18n.language] || field.en || ""
}

const AdCard = ({ ad, image, price }) => {
  const { t, i18n } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { sendLikeNotification } = useNotifications()
  const { wishlist: likedAds } = useSelector((state) => state.wishlist)
  const liked = ad && likedAds.some((item) => item._id === ad._id)

  const currentDisplayLanguage = i18n.language

  const displayTitle =
    typeof ad.title === "object" ? ad.title?.[currentDisplayLanguage] || ad.title?.en || "" : ad.title || ""
  // const displayLocation =
  //   typeof ad.location === "object"
  //     ? ad.location?.postalCode?.[currentDisplayLanguage] || ad.location?.postalCode?.en || ""
  //     : ad.postalCode || ad.location || t("home.unknownLocation")
  const trimText = (text, maxLength = 30) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

// Example usage for your ad
const displayLocation = trimText(ad.description || ad.title || "No details", 40);
  const token = localStorage.getItem("accessToken")

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
      className="relative group cursor-pointer hover:scale-105 transition duration-300 ease-in flex flex-col items-center justify-between border border-gray-800 shadow-md hover:shadow-lg gap-3 p-3 rounded-xl w-[200px] bg-white"
    >
      {token && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleLikeToggle(e)
          }}
          className={`absolute top-2 right-2 cursor-pointer transition duration-300 text-lg ${
            liked ? "text-red-500" : "text-gray-400"
          }`}
        >
          {liked ? <Favorite /> : <FavoriteBorder />}
        </button>
      )}

      <div className="w-full h-[140px] flex justify-center items-center">
        <img src={image || "/placeholder.svg"} alt={displayTitle} className="h-full w-full object-contain rounded-md" />
      </div>

      <div className="w-full text-left">
        <p className="truncate text-gray-700 font-semibold text-sm">{displayTitle}</p>
        <p className="text-gray-400 font-normal text-xs mt-1">{displayLocation}</p>
        <p className="text-green-700 font-bold text-sm mt-2">₼ {price}</p>
      </div>
    </div>
  )
}

const SectionWithAds = ({ titleKey, ads, pagination, onPageChange }) => {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 rounded-2xl shadow-lg mt-5 border border-gray-100"
    >
      {/* Header */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Package className="w-6 h-6 text-green-600" />
        {t(titleKey)}
      </h2>

      {/* Ads Grid */}
      <div className="flex flex-wrap gap-6 justify-center md:justify-start">
        {ads.map((ad, index) => (
          <motion.div
            key={ad._id || `ad-${index}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <AdCard
              ad={ad}
              image={
                ad.image ||
                `${import.meta.env.VITE_SERVER}/${ad.pictures?.[0]?.replace(/\\/g, "/") || "uploads/placeholder.jpg"}`
              }
              price={ad.price}
            />
          </motion.div>
        ))}

        {ads.length === 0 && (
          <div className="flex flex-col items-center justify-center text-gray-500 text-center w-full py-10">
            <Package className="w-10 h-10 mb-2 text-gray-400" />
            <p className="text-sm">{t("home.noAdsFound")}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {ads.length > 0 && pagination && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center items-center gap-4 mt-8"
        >
          <button
            disabled={!pagination.hasPrevPage}
            onClick={() => onPageChange((p) => ({ ...p, currentPage: pagination.prevPage }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-colors ${
              pagination.hasPrevPage
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-gray-50 cursor-not-allowed text-gray-400"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            {t("home.pagination.prev")}
          </button>

          <span className="text-sm font-medium text-gray-700">
            {t("home.pagination.pageOf", {
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages,
            })}
          </span>

          <button
            disabled={!pagination.hasNextPage}
            onClick={() => onPageChange((p) => ({ ...p, currentPage: pagination.nextPage }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-colors ${
              pagination.hasNextPage
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-gray-50 cursor-not-allowed text-gray-400"
            }`}
          >
            {t("home.pagination.next")}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
const Home = () => {
  const { t, i18n } = useTranslation()
  const [activeCategory, setActiveCategory] = useState(t("home.allProducts"))
  const { latestAds, recommendedAds } = useSelector((state) => state.products)
  const { priceRange, condition, radius, city, category, postalCode, latitude, longitude, searchQuery, location } =
    useSelector((state) => state.filter)
  const dispatch = useDispatch()
  const navigate = useNavigate() // Added navigate for gallery item clicks
  console.log("Current Filters:", { priceRange, condition, radius, city, category, postalCode, location, searchQuery })
  const [latestPagination, setLatestPagination] = useState({ currentPage: 1 })
  const [recommendedPagination, setRecommendedPagination] = useState({ currentPage: 1 })

  const [galleryData, setGalleryData] = useState([])
  const [galleryLoading, setGalleryLoading] = useState(false)

  const hasActiveFilters = () => {
    return (
      (priceRange && priceRange[0] > 0) ||
      (priceRange && priceRange[1] < 10000) ||
      condition ||
      radius > 0 ||
      city ||
      searchQuery ||
      (location && location.latitude && location.longitude) ||
      category || // ✅ check category
      postalCode // ✅ check postalCode
    )
  }

  const clearFilters = () => {
    dispatch(resetFilters())
  }

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

      // Language
      params.append("lang", i18n.language)

      // User
      const currentUserId = localStorage.getItem("userId")
      if (currentUserId) {
        params.append("userId", currentUserId)
      }

      // Price range
      if (priceRange && priceRange.length === 2) {
        params.append("minPrice", priceRange[0])
        params.append("maxPrice", priceRange[1])
      }

      // Location or City
      if (location && location.latitude && location.longitude) {
        params.append("latitude", location.latitude)
        params.append("longitude", location.longitude)
        if (radius > 0) {
          params.append("radiusInKm", radius)
        }
      } else if (city) {
        params.append("city", city)
      }

      // Condition
      if (condition) {
        params.append("condition", condition)
      }

      // Category ✅
      if (category) {
        params.append("category", category)
      }

      // Postal code ✅
      if (postalCode) {
        params.append("postalCode", postalCode)
      }

      // Search query
      if (searchQuery) {
        params.append("search", searchQuery)
      }

      // Endpoint
      let endpoint = `${import.meta.env.VITE_SERVER}/api/products/getProducts`
      if (type === "nearby" && location?.latitude && location?.longitude && radius > 0) {
        endpoint = `${import.meta.env.VITE_SERVER}/api/products/nearby`
      }
      console.log("Using endpoint:", endpoint)
      console.log("Fetching products with params:", params.toString())

      // API Call
      const res = await fetch(`${endpoint}?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      })

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
    if (latitude && longitude) {
      fetchProducts("nearby", 1)
    }
  }, [latitude, longitude, radius, t, i18n.language, dispatch])

  useEffect(() => {
    fetchProducts("category", latestPagination.currentPage)
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
    category, // ✅ added
    postalCode, // ✅ added
    t,
    i18n.language,
    dispatch,
  ])

  useEffect(() => {
    fetchProducts("recommended", recommendedPagination.currentPage)
  }, [
    recommendedPagination.currentPage,
    priceRange,
    condition,
    city,
    searchQuery,
    radius,
    latitude,
    longitude,
    category, // ✅ added
    postalCode, // ✅ added
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

      // Map API data to gallery format
      const mappedProducts = products.map((product) => ({
        _id: product._id,
        title: product.title,
        location: product.location || product.postalCode || "Unknown Location",
        price: product.price, // Removed ₼ symbol formatting to handle it in display
        image: product.pictures?.[0]
          ? `${import.meta.env.VITE_SERVER}/${product.pictures[0].replace(/\\/g, "/")}`
          : "/images/placeholder.jpg",
        owner: product.owner, // Added owner data for navigation
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

  const handleGalleryItemClick = (productId) => {
    navigate(`products/product/${productId}`)
  }

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
  const scrollCompanySlider = (direction) => {
    if (!companyRef.current) return
    const scrollAmount = direction === "left" ? -300 : 300
    companyRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  const galleryRef = useRef(null)
  const scrollGallery = (direction) => {
    if (!galleryRef.current) return
    const scrollAmount = direction === "left" ? -300 : 300
    galleryRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-[2rem]">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-screen-xl px-4 flex flex-wrap gap-4 items-start">
          {/* Left Ad */}
          <div className="hidden lg:block w-[160px] sticky top-[180px] h-fit z-30">
            <img
              src={leftadImage || "/placeholder.svg"}
              alt={t("home.leftAdAlt")}
              className="w-full h-[550px] object-cover rounded"
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col gap-3 w-full lg:w-auto">
            {/* Banner */}
            <div className="relative ">
              <img
                src={bannerImage || "/placeholder.svg"}
                alt={t("home.bannerAlt")}
                className="w-full h-[233px] object-cover rounded-xl shadow"
              />
              <div className="absolute bottom-4 left-6 z-10">
                <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg">
                  {t("home.joinNow")}
                </button>
              </div>
            </div>

            {/* Filter Status */}
            {hasActiveFilters() && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-800 font-medium">{t("home.activeFilters")}:</span>
                    <div className="flex flex-wrap gap-2">
                      {priceRange && priceRange[0] > 0 && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {t("home.minPrice")}: ₼ {priceRange[0]}
                        </span>
                      )}
                      {priceRange && priceRange[1] < 10000 && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {t("home.maxPrice")}: ₼ {priceRange[1]}
                        </span>
                      )}
                      {condition && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {t("home.condition")}: {condition}
                        </span>
                      )}
                      {city && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {t("home.city")}: {city}
                        </span>
                      )}
                      {radius > 0 && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {t("home.radius", { val: radius })}
                        </span>
                      )}
                      {location.latitude && location.longitude && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {t("home.locationBased")}
                        </span>
                      )}
                      {searchQuery && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {t("home.search")}: "{searchQuery}"
                        </span>
                      )}
                      {category && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {"category"}: "{category}"
                        </span>
                      )}

                      {postalCode && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {"postalCode"}: {postalCode}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                  >
                    {t("home.clearAllFilters")}
                  </button>
                </div>
              </div>
            )}

            {/* Category + Gallery Section */}
             <div className="flex flex-wrap gap-6">
      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-5 rounded-2xl shadow-lg w-full md:w-[35%] h-[350px] overflow-y-auto border border-gray-100"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
          <Tag className="w-5 h-5 text-green-600" /> {t("home.categories")}
        </h2>
        <ul className="text-sm space-y-3 pl-1 text-gray-700">
          {categoryKeys.map((key) => {
            const translatedCat = t(key)
            return (
              <motion.li
                whileHover={{ scale: 1.05, x: 5 }}
                key={key}
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
                className={`cursor-pointer px-2 py-1 rounded-md transition-colors ${
                  activeCategory === translatedCat
                    ? "font-semibold text-green-700 bg-green-50"
                    : "hover:bg-gray-100"
                }`}
              >
                {translatedCat}
              </motion.li>
            )
          })}
        </ul>
      </motion.div>

      {/* Gallery */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 flex-1 w-full md:w-[60%]"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-green-600" /> {t("home.gallery")}
          </h2>
          <div className="flex gap-2">
            <button
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              onClick={fetchGalleryData}
              disabled={galleryLoading}
              title="Refresh Gallery"
            >
              {galleryLoading ? (
                <RefreshCw className="animate-spin w-4 h-4" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
            <button
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              onClick={() => scrollGallery("left")}
              title={t("home.scrollLeft")}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              onClick={() => scrollGallery("right")}
              title={t("home.scrollRight")}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Gallery List */}
        <div
          ref={galleryRef}
          className="flex gap-5 overflow-x-auto scroll-smooth hide-scrollbar pb-2"
        >
          {galleryLoading ? (
            <div className="flex items-center justify-center w-full h-[200px]">
              <div className="animate-pulse text-gray-500">Loading gallery...</div>
            </div>
          ) : galleryData.length > 0 ? (
            galleryData.map((item, index) => (
              <motion.div
                key={item._id || index}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                onClick={() => handleGalleryItemClick(item._id)}
                className="min-w-[200px] max-w-[220px] flex-shrink-0 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl cursor-pointer transition-all relative overflow-hidden group"
              >
                {/* Floating Icon */}
                <div className="absolute top-2 left-2 bg-white shadow-md rounded-full p-1 z-10">
                  <ImageIcon className="w-4 h-4 text-green-600" />
                </div>

                {/* Image */}
                <div className="w-full h-[150px] bg-gray-50 flex justify-center items-center overflow-hidden rounded-t-2xl">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={
                      typeof item.title === "object"
                        ? item.title[i18n.language] || item.title.en
                        : item.title
                    }
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Content */}
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-800 truncate mb-1">
                    {typeof item.title === "object"
                      ? item.title[i18n.language] || item.title.en
                      : item.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate mb-2">
                    {typeof item.description === "object"
                      ? item.description
                      : item.description}
                  </p>
                  <p className="text-sm font-bold text-green-700">
                    ₼ {item.price}
                  </p>
                </div>

                {/* Overlay Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              </motion.div>
            ))
          ) : (
            <div className="flex items-center justify-center w-full h-[200px]">
              <p className="text-gray-500">No products found</p>
            </div>
          )}
        </div>
      </motion.div>
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
            <div className="bg-white p-4 mt-3 rounded shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{t("home.companyWebsites")}</h2>
                <div className="flex gap-2">
                  <button
                    className="w-8 h-8 border border-gray-300 cursor-pointer rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
                    onClick={() => scrollCompanySlider("left")}
                    title={t("home.scrollLeft")}
                  >
                    &#8592;
                  </button>
                  <button
                    className="w-8 h-8 border border-gray-300 cursor-pointer rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
                    onClick={() => scrollCompanySlider("right")}
                    title={t("home.scrollRight")}
                  >
                    &#8594;
                  </button>
                </div>
              </div>

              <div ref={companyRef} className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar pb-2">
                {companyWebsites.map((site, index) => (
                  <div key={index} className="w-[22%] bg-white border rounded shadow-sm flex-shrink-0 relative">
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
                    <div className="p-2">
                      <p className="text-sm font-medium text-gray-800">{site.name[i18n.language] || site.name.en}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {site.description[i18n.language] || site.description.en}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Ad */}
          <div className="hidden lg:block w-[160px] sticky top-[180px] h-fit z-30">
            <img
              src={rightadImage || "/placeholder.svg"}
              alt={t("home.rightAdAlt")}
              className="w-full h-[550px] object-cover rounded"
            />
          </div>
        </div>
      </div>

      {/* Notification Demo - Remove this in production */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
      </div>

      <Footer />
    </div>
  )
}

export default Home
