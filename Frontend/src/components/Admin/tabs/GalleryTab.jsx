import { useState, useEffect } from "react"
import { RefreshCw, Star, Tag, User, ImageOff, TrendingDown } from "lucide-react"
import { SERVER_URL } from "../adminUtils"

export default function GalleryTab() {
  const [galleryData, setGalleryData]   = useState([])
  const [galleryLoading, setGalleryLoading] = useState(false)

  const fetchGalleryData = async () => {
    try {
      setGalleryLoading(true)
      const response = await fetch(`${SERVER_URL}/api/products/priority`)
      const result   = await response.json()
      if (result.success) {
        const products = result.data.products || []
        setGalleryData(products.map((p) => ({
          id:          p._id,
          name:        p.title,
          description: p.description,
          price:       p.price,
          image:       p.pictures?.length ? `${SERVER_URL}/${p.pictures[0]}` : null,
          condition:   p.condition,
          category:    p.category,
          location:    p.location,
          owner:       p.name || "Unknown",
        })))
      }
    } catch (err) {
      console.error("Gallery API error:", err)
    } finally {
      setGalleryLoading(false)
    }
  }

  const handleUnboost = async (productId) => {
    if (!window.confirm("Are you sure you want to unboost this product?")) return
    try {
      const response = await fetch(`${SERVER_URL}/api/products/priority/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || "Failed to unboost product")
      alert(result.message || "Product unboosted successfully!")
      await fetchGalleryData()
    } catch (error) {
      console.error("Error unboosting product:", error)
      alert(`Failed to unboost product: ${error.message}`)
    }
  }

  useEffect(() => { fetchGalleryData() }, [])

  return (
    <div className="space-y-5">

      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Boosted Products</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {galleryData.length} product{galleryData.length !== 1 ? "s" : ""} currently boosted
          </p>
        </div>
        <button
          onClick={fetchGalleryData}
          disabled={galleryLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${galleryLoading ? "animate-spin" : ""}`} />
          {galleryLoading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Loading spinner */}
      {galleryLoading && galleryData.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading boosted products…</p>
        </div>
      ) : galleryData.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-20 flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
            <Star className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No boosted products</p>
          <p className="text-xs text-slate-400">Boost a product to have it appear here.</p>
          <button
            onClick={fetchGalleryData}
            className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      ) : (
        /* Product grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {galleryData.map((product, index) => (
            <div
              key={product.id || index}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative h-48 bg-slate-100">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name || "Product"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="w-10 h-10 text-slate-300" />
                  </div>
                )}
                {/* Boost badge */}
                <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-current" /> Boosted
                </span>
              </div>

              {/* Body */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 truncate mb-1">
                  {product.name || "Unnamed Product"}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3 min-h-[2rem]">
                  {product.description || "No description available"}
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {product.category && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      <Tag className="w-3 h-3" /> {product.category}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                    <User className="w-3 h-3" /> {product.owner}
                  </span>
                </div>

                {/* Price + Condition */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <span className="text-lg font-bold text-emerald-600">₼ {product.price || "0.00"}</span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {product.condition || "Unknown"}
                  </span>
                </div>

                {/* Unboost button */}
                <button
                  onClick={() => handleUnboost(product.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <TrendingDown className="w-4 h-4" />
                  Unboost Product
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
