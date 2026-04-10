import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Store, MapPin, Package, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react"
import { useTranslation } from "react-i18next"

const AllShops = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTimeout, setSearchTimeout] = useState(null)

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "Electronics", label: t("home.category.electronics") || "Electronics" },
    { value: "Clothing & Fashion", label: t("home.category.clothingFashion") || "Clothing & Fashion" },
    { value: "Home & Garden", label: t("home.category.householdFurniture") || "Home & Garden" },
    { value: "Vehicles", label: t("home.category.carsMotorcycles") || "Vehicles" },
    { value: "Sports & Outdoors", label: t("home.category.leisureHobbyNeighborhood") || "Sports & Outdoors" },
    { value: "Books & Media", label: "Books & Media" },
    { value: "Services", label: t("home.category.service") || "Services" },
    { value: "General", label: "General" },
    { value: "Other", label: t("home.category.other") || "Other" },
  ]

  const getLocalizedText = (field) => {
    if (!field) return ""
    const lang = i18n.language || "en"
    return field[lang] || field.en || ""
  }

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page, limit: 12 })
        if (category !== "all") params.append("category", category)
        if (search.trim()) params.append("search", search.trim())
        const res = await fetch(`${import.meta.env.VITE_SERVER}/api/shops?${params}`)
        const data = await res.json()
        if (data.success) {
          setShops(data.data || [])
          setTotalPages(data.pagination?.totalPages || 1)
        }
      } catch (err) {
        console.error("Error fetching shops:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchShops()
  }, [page, category, search])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearch(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(setTimeout(() => setPage(1), 500))
  }

  const handlePageChange = (val) => {
    setPage(val)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold mb-1">Browse Shops</h1>
          <p className="text-green-100">Discover shops and find great products</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search shops..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[180px]"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                <div className="h-28 bg-gray-200" />
                <div className="p-4 pt-10">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No shops found</p>
            <p className="text-gray-400 text-sm mt-1">Try different search or category</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {shops.map((shop) => (
                <div
                  key={shop._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/shop/${shop.slug}`)}
                >
                  {/* Banner */}
                  <div
                    className="h-28 bg-gradient-to-r from-green-500 to-green-400"
                    style={shop.banner ? {
                      backgroundImage: `url(${import.meta.env.VITE_SERVER}${shop.banner})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    } : {}}
                  />

                  {/* Content with overlapping logo */}
                  <div className="relative px-4 pb-4 pt-0">
                    {/* Logo */}
                    <div className="w-16 h-16 rounded-full border-4 border-white shadow-sm overflow-hidden bg-green-600 flex items-center justify-center -mt-8 mb-2">
                      {shop.logo ? (
                        <img
                          src={`${import.meta.env.VITE_SERVER}${shop.logo}`}
                          alt={getLocalizedText(shop.shopName)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-8 h-8 text-white" />
                      )}
                    </div>

                    {/* Name + verified */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm truncate">
                        {getLocalizedText(shop.shopName)}
                      </span>
                      {shop.isVerified && (
                        <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* Category */}
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 border border-gray-200 rounded-full text-gray-500">
                      {shop.category}
                    </span>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-2 text-gray-400 text-xs">
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        {shop.totalProducts || 0} products
                      </span>
                      {shop.address?.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {shop.address.city}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {getLocalizedText(shop.description) && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                        {getLocalizedText(shop.description)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...")
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? "bg-green-600 text-white"
                            : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AllShops
