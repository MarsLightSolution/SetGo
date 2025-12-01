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
import { Image as ImageIcon } from "lucide-react"
import { motion } from "framer-motion"
import { Image as RefreshCw, ArrowLeft, ArrowRight, Tag, Package, Store, ChevronRight } from "lucide-react"
import { ChatbotButton } from "../components/Chat/ChatbotButton"

import { useTranslation } from "react-i18next"
import i18n from "../i18n"

import { setProducts } from "../slices/productSlices"

const getLocalizedText = (field) => {
  if (!field) return ""
  if (typeof field === "string") return field
  return field[i18n.language] || field.en || ""
}

/* -------------------- AdCard -------------------- */
const AdCard = ({ ad, image, price, description, condition, name, createdAt }) => {
  const { t, i18n } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { sendLikeNotification } = useNotifications()
  const { wishlist: likedAds } = useSelector((state) => state.wishlist)
  const liked = ad && likedAds.some((item) => item._id === ad._id)

  const currentDisplayLanguage = i18n.language
  const displayTitle =
    typeof ad.title === "object"
      ? ad.title?.[currentDisplayLanguage] || ad.title?.en || ""
      : ad.title || ""

  const trimText = (text, maxLength = 40) => {
    if (!text) return ""
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  const displayDescription = trimText(description || ad.description || "", 25)
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
    <motion.div
      onClick={handleCardClick}
      whileHover={{ scale: 1.03 }}
      className="relative group flex flex-col border border-gray-200 rounded-2xl bg-white shadow-md hover:shadow-lg transition-all duration-300 p-4 cursor-pointer w-[100%]"
    >
      {/* Like Button */}
      {token && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleLikeToggle(e)
          }}
          className={`absolute top-3 right-3 cursor-pointer transition duration-300 text-xl ${
            liked ? "text-red-500" : "text-gray-400"
          }`}
        >
          {liked ? <Favorite /> : <FavoriteBorder />}
        </button>
      )}

      {/* Image */}
      <div className="w-full h-40 flex gap-4 justify-center items-center bg-gray-50 rounded-xl ">
        <img src={image || "/placeholder.svg"} alt={displayTitle} className="h-full w-full object-contain" />
      </div>

      {/* Content */}
      <div className="mt-3 w-full">
        <p className="truncate text-gray-800 font-semibold text-base">{displayTitle}</p>
        <p className="text-gray-500 text-xs mt-1">{displayDescription}</p>

        <div className="flex items-center justify-between mt-2">
          <p className="text-green-700 font-bold text-sm">₼ {price}</p>
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>{condition || "—"}</span>
          <span className="font-medium text-gray-600">👤 {name || "Unknown"}</span>
        </div>
      </div>
    </motion.div>
  )
}

/* -------------------- ShopCard -------------------- */
const ShopCard = ({ shop }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const getLocalizedText = (field) => {
    if (!field) return ""
    if (typeof field === "string") return field
    return field[i18n.language] || field.en || ""
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      onClick={() => navigate(`/shop/${shop.slug || shop._id}`)}
      className="min-w-[220px] max-w-[240px] flex-shrink-0 bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl cursor-pointer transition-all overflow-hidden"
    >
      {/* Banner */}
      <div
        className="w-full h-20 bg-gradient-to-r from-green-500 to-green-400"
        style={{
          backgroundImage: shop.banner
            ? `url(${import.meta.env.VITE_SERVER}${shop.banner})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Content */}
      <div className="p-3 pt-0 relative">
        {/* Logo */}
        <div className="w-12 h-12 rounded-full bg-green-600 border-2 border-white shadow-md flex items-center justify-center overflow-hidden -mt-6 mb-2">
          {shop.logo ? (
            <img
              src={`${import.meta.env.VITE_SERVER}${shop.logo}`}
              alt={getLocalizedText(shop.shopName)}
              className="w-full h-full object-cover"
            />
          ) : (
            <Store className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Shop Name */}
        <p className="text-sm font-semibold text-gray-800 truncate">
          {getLocalizedText(shop.shopName)}
        </p>

        {/* Category */}
        <p className="text-xs text-gray-500 truncate">{shop.category}</p>

        {/* Stats */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            {shop.totalProducts || 0} {t("shop.products") || "products"}
          </span>
          {shop.address?.city && (
            <span className="truncate">{shop.address.city}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* -------------------- SectionWithAds -------------------- */
const SectionWithAds = ({ titleKey, ads, pagination, onPageChange }) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)

  const handlePageChange = (page) => {
    if (isLoading) return
    setIsLoading(true)
    onPageChange((p) => ({ ...p, currentPage: page }))
    setTimeout(() => setIsLoading(false), 500)
  }

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
      <motion.div
        key={pagination.currentPage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {ads.length > 0 ? (
          ads.map((ad, index) => (
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
                description={ad.description}
                condition={ad.condition}
                name={ad.name}
                createdAt={ad.createdAt}
              />
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500 text-center w-full py-10">
            <Package className="w-10 h-10 mb-2 text-gray-400" />
            <p className="text-sm">{t("home.noAdsFound")}</p>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {ads.length > 0 && pagination && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center items-center gap-4 mt-8"
        >
          <button
            disabled={!pagination.hasPrevPage || isLoading}
            onClick={() => handlePageChange(pagination.prevPage)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-colors ${
              pagination.hasPrevPage && !isLoading
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
            disabled={!pagination.hasNextPage || isLoading}
            onClick={() => handlePageChange(pagination.nextPage)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-colors ${
              pagination.hasNextPage && !isLoading
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

/* -------------------- ShopsSection -------------------- */
const ShopsSection = ({ shops, loading, onRefresh }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const shopsRef = useRef(null)

  const scrollShops = (direction) => {
    if (!shopsRef.current) return
    const scrollAmount = direction === "left" ? -300 : 300
    shopsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 mt-5"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Store className="w-6 h-6 text-green-600" />
          {t("home.featuredShops") || "Featured Shops"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/shops")}
            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
          >
            {t("home.viewAllShops") || "View All"}
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            onClick={() => scrollShops("left")}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            onClick={() => scrollShops("right")}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Shops List */}
      <div
        ref={shopsRef}
        className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar pb-2"
      >
        {loading ? (
          <div className="flex items-center justify-center w-full h-[180px]">
            <div className="animate-pulse text-gray-500">
              {t("common.loading") || "Loading..."}
            </div>
          </div>
        ) : shops.length > 0 ? (
          shops.map((shop) => (
            
            <ShopCard key={shop._id} shop={shop} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-[180px] text-gray-500">
            <Store className="w-10 h-10 mb-2 text-gray-400" />
            <p className="text-sm">{t("home.noShopsFound") || "No shops found"}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const Home = () => {
  const { t, i18n } = useTranslation()
  const [activeCategory, setActiveCategory] = useState(t("home.allProducts"))
  const { latestAds } = useSelector((state) => state.products)
  const { priceRange, condition, radius, city, category, postalCode, latitude, longitude, searchQuery, location } =
    useSelector((state) => state.filter)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [latestPagination, setLatestPagination] = useState({ currentPage: 1 })

  const [galleryData, setGalleryData] = useState([])
  const [galleryLoading, setGalleryLoading] = useState(false)

  // Shops state
  const [shops, setShops] = useState([])
  const [shopsLoading, setShopsLoading] = useState(false)

  const hasActiveFilters = () => {
    return (
      (priceRange && priceRange[0] > 0) ||
      (priceRange && priceRange[1] < 10000) ||
      condition ||
      radius > 0 ||
      city ||
      searchQuery ||
      (location && location.latitude && location.longitude) ||
      category ||
      postalCode
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

      params.append("lang", i18n.language)

      const currentUserId = localStorage.getItem("userId")
      if (currentUserId) {
        params.append("userId", currentUserId)
      }

      if (priceRange && priceRange.length === 2) {
        params.append("minPrice", priceRange[0])
        params.append("maxPrice", priceRange[1])
      }

      if (location && location.latitude && location.longitude) {
        params.append("latitude", location.latitude)
        params.append("longitude", location.longitude)
        if (radius > 0) {
          params.append("radiusInKm", radius)
        }
      } else if (city) {
        params.append("city", city)
      }

      if (condition) {
        params.append("condition", condition)
      }

      if (category) {
        params.append("category", category)
      }

      if (postalCode) {
        params.append("postalCode", postalCode)
      }

      if (searchQuery) {
        params.append("search", searchQuery)
      }

      let endpoint = `${import.meta.env.VITE_SERVER}/api/products/getProducts`
      if (type === "nearby" && location?.latitude && location?.longitude && radius > 0) {
        endpoint = `${import.meta.env.VITE_SERVER}/api/products/nearby`
      }

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

      dispatch(setProducts({ latestAds: products }))
      setLatestPagination(pagination)
    } catch (err) {
      console.error(t("home.fetchFailed"), err)
    }
  }

  // Fetch shops
  const fetchShops = async () => {
    setShopsLoading(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/api/shops?limit=10`,
        { method: "GET" }
      )
      const data = await res.json()

      if (data.success) {
        setShops(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching shops:", error)
    } finally {
      setShopsLoading(false)
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
    category,
    postalCode,
    t,
    i18n.language,
    dispatch,
  ])

  // Fetch shops on mount
  useEffect(() => {
    fetchShops()
  }, [])

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
        description: product.description,
        condition: product.condition,
        image: product.pictures?.[0]
          ? `${import.meta.env.VITE_SERVER}/${product.pictures[0].replace(/\\/g, "/")}`
          : "/images/placeholder.jpg",
        owner: product.owner,
        name: product.name,
        createdAt: product.createdAt,
        category: product.category,
        priority: product.priority || false,
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

  const galleryRef = useRef(null)
  const scrollGallery = (direction) => {
    if (!galleryRef.current) return
    const scrollAmount = direction === "left" ? -300 : 300
    galleryRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-[2rem]">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-screen-xl px-4 flex gap-4 items-start">
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
                className="bg-white p-5 rounded-2xl shadow-lg w-full md:w-[35%] h-[395px] overflow-y-auto border border-gray-100"
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
                        key={item._id}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => handleGalleryItemClick(item._id)}
                        className="min-w-[200px] max-w-[220px] flex-shrink-0 bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl cursor-pointer transition-all relative overflow-hidden group"
                      >
                        {/* Image */}
                        <div className="w-full h-[150px] bg-gray-50 flex justify-center items-center overflow-hidden rounded-t-2xl relative">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.title}
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {/* Heart Icon */}
                          <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-4 h-4 text-gray-400 hover:text-red-500 transition"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733C11.285 4.876 9.623 3.75 7.688 3.75 5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-3 flex flex-col gap-1">
                          <p className="text-sm font-semibold text-gray-800 truncate capitalize">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate leading-snug">
                            {item.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-bold text-green-700">₼ {item.price}</p>
                            <span className="text-[11px] text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                            <span>{item.condition}</span>
                            <span className="flex items-center gap-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                className="w-3 h-3 text-purple-600"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                                />
                              </svg>
                              {item.name}
                            </span>
                          </div>
                        </div>
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

            {/* Featured Shops Section */}
            <ShopsSection
              shops={shops}
              loading={shopsLoading}
              onRefresh={fetchShops}
            />

            {/* Latest Ads Section */}
            <SectionWithAds
              titleKey="home.latestAds"
              ads={latestAds}
              pagination={latestPagination}
              onPageChange={setLatestPagination}
            />
          </div>

          {/* Right Ad */}
          <div className="hidden lg:block w-[160px] sticky top-[180px] h-fit z-30">
            <img
              src={rightadImage || "/placeholder.svg"}
              alt={t("home.rightAdAlt")}
              className="w-[160px] h-[550px] object-cover rounded"
            />
          </div>
        </div>
      </div>

      <ChatbotButton />
      <Footer />
    </div>
  )
}

export default Home