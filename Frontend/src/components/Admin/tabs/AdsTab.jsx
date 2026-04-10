import { useState, useEffect } from "react"
import { Search, Megaphone, Edit2, Trash2, ToggleLeft, ToggleRight, Upload, X, Plus } from "lucide-react"
import { SERVER_URL } from "../adminUtils"

const EMPTY_FORM = { position: "banner", title: "", linkUrl: "", isActive: true, image: null }

export default function AdsTab() {
  const [ads, setAds]                   = useState([])
  const [adsLoading, setAdsLoading]     = useState(false)
  const [searchInput, setSearchInput]   = useState("")
  const [adSearch, setAdSearch]         = useState("")
  const [editingAd, setEditingAd]       = useState(null)
  const [adFormData, setAdFormData]     = useState(EMPTY_FORM)
  const [adPreview, setAdPreview]       = useState(null)
  const [submitting, setSubmitting]     = useState(false)

  const fetchAds = async () => {
    try {
      setAdsLoading(true)
      const res  = await fetch(`${SERVER_URL}/api/ads/all`)
      const data = await res.json()
      if (data.success) setAds(data.data || [])
    } catch (err) {
      console.error("Failed to load ads:", err)
    } finally {
      setAdsLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5 MB"); return }
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) { alert("Only JPG, PNG, or WebP allowed"); return }
    setAdFormData((p) => ({ ...p, image: file }))
    const reader = new FileReader()
    reader.onloadend = () => setAdPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!adFormData.image && !editingAd) { alert("Please select an image"); return }
    if (!adFormData.title.trim())        { alert("Please enter a title"); return }
    setSubmitting(true)
    const formData = new FormData()
    formData.append("position", adFormData.position)
    formData.append("title", adFormData.title.trim())
    formData.append("linkUrl", adFormData.linkUrl.trim())
    formData.append("isActive", adFormData.isActive)
    if (adFormData.image) formData.append("image", adFormData.image)
    try {
      const url    = editingAd ? `${SERVER_URL}/api/ads/${editingAd._id}` : `${SERVER_URL}/api/ads`
      const method = editingAd ? "PUT" : "POST"
      const res    = await fetch(url, { method, body: formData })
      const data   = await res.json()
      if (data.success) {
        alert(data.message || (editingAd ? "Ad updated!" : "Ad created!"))
        fetchAds()
        resetForm()
      } else {
        alert(data.message || "Error saving ad")
      }
    } catch (err) {
      console.error("Error saving ad:", err)
      alert("Error saving ad. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setEditingAd(null)
    setAdFormData(EMPTY_FORM)
    setAdPreview(null)
  }

  const handleEdit = (ad) => {
    setEditingAd(ad)
    setAdFormData({ position: ad.position, title: ad.title, linkUrl: ad.link || "", isActive: ad.isActive, image: null })
    setAdPreview(`${SERVER_URL}${ad.image}`)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const toggleStatus = async (adId, currentStatus) => {
    try {
      const ad = ads.find((a) => a._id === adId)
      if (!ad) return
      const formData = new FormData()
      formData.append("isActive", !currentStatus)
      formData.append("title", ad.title)
      formData.append("position", ad.position)
      if (ad.link) formData.append("linkUrl", ad.link)
      const res  = await fetch(`${SERVER_URL}/api/ads/${adId}`, { method: "PUT", body: formData })
      const data = await res.json()
      if (data.success) { fetchAds() }
      else alert(data.message || "Failed to update status")
    } catch (err) {
      console.error("Error toggling ad:", err)
      alert("Failed to update ad status")
    }
  }

  const deleteAd = async (adId) => {
    if (!window.confirm("Delete this ad? This cannot be undone.")) return
    try {
      const res  = await fetch(`${SERVER_URL}/api/ads/${adId}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) { alert("Ad deleted"); fetchAds() }
      else alert(data.message || "Failed to delete ad")
    } catch (err) {
      console.error("Error deleting ad:", err)
      alert("Failed to delete ad")
    }
  }

  useEffect(() => { fetchAds() }, [])

  const filteredAds = ads.filter(
    (ad) =>
      ad.title?.toLowerCase().includes(adSearch.toLowerCase()) ||
      ad.position?.toLowerCase().includes(adSearch.toLowerCase()),
  )

  const positionLabel = (p) => {
    if (p === "banner")                       return "Main Banner"
    if (p === "left"  || p === "left-sidebar")  return "Left Sidebar"
    if (p === "right" || p === "right-sidebar") return "Right Sidebar"
    return p
  }

  return (
    <div className="space-y-6">

      {/* ── Create / Edit form ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {editingAd ? "Edit Advertisement" : "Create Advertisement"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {editingAd ? `Editing: ${editingAd.title}` : "Add a new ad to the storefront"}
            </p>
          </div>
          {editingAd && (
            <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Position */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Position *</label>
              <select
                value={adFormData.position}
                onChange={(e) => setAdFormData((p) => ({ ...p, position: e.target.value }))}
                disabled={!!editingAd}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="banner">Main Banner (1200 × 233 px)</option>
                <option value="left-sidebar">Left Sidebar (160 × 550 px)</option>
                <option value="right-sidebar">Right Sidebar (160 × 550 px)</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Title * <span className="font-normal text-slate-400">{adFormData.title.length}/100</span>
              </label>
              <input
                type="text"
                value={adFormData.title}
                onChange={(e) => setAdFormData((p) => ({ ...p, title: e.target.value }))}
                maxLength={100}
                required
                placeholder="e.g. Summer Sale 2024"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Link URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Link URL <span className="font-normal text-slate-400">(optional)</span></label>
              <input
                type="url"
                value={adFormData.linkUrl}
                onChange={(e) => setAdFormData((p) => ({ ...p, linkUrl: e.target.value }))}
                placeholder="https://example.com/promo"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3 pt-5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={adFormData.isActive}
                  onChange={(e) => setAdFormData((p) => ({ ...p, isActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </label>
              <span className="text-sm font-medium text-slate-700">
                {adFormData.isActive ? "Active — visible on storefront" : "Inactive — hidden"}
              </span>
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Ad Image * <span className="font-normal text-slate-400">Max 5 MB · JPG, PNG, WebP</span>
            </label>
            {adPreview ? (
              <div className="relative inline-block">
                <img src={adPreview} alt="Preview" className="max-h-48 rounded-lg border border-slate-200 object-contain" />
                <button
                  type="button"
                  onClick={() => { setAdPreview(null); setAdFormData((p) => ({ ...p, image: null })) }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <Upload className="w-7 h-7 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-500">Click to upload image</span>
                <span className="text-xs text-slate-400 mt-0.5">or drag and drop</span>
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
              </label>
            )}
            {adFormData.image && (
              <p className="text-xs text-slate-500 mt-1.5">
                {adFormData.image.name} · {(adFormData.image.size / 1024).toFixed(0)} KB
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
              ) : editingAd ? (
                <><Edit2 className="w-3.5 h-3.5" /> Update Ad</>
              ) : (
                <><Plus className="w-3.5 h-3.5" /> Create Ad</>
              )}
            </button>
            {editingAd && (
              <button type="button" onClick={resetForm} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Ads list table ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Advertisement Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">{filteredAds.length} ads</p>
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ads…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setAdSearch(searchInput)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {adsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">
              {adSearch ? "No ads match your search" : "No ads created yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Preview", "Title", "Position", "Clicks", "Impressions", "CTR", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAds.map((ad) => {
                  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : "0.00"
                  return (
                    <tr key={ad._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <img
                          src={`${SERVER_URL}${ad.image}`}
                          alt={ad.title}
                          className="h-12 w-20 object-cover rounded-lg border border-slate-200"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-900 max-w-[180px] truncate">
                        {ad.title}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          {positionLabel(ad.position)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700 tabular-nums">{ad.clicks || 0}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-700 tabular-nums">{ad.impressions || 0}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-blue-600 tabular-nums">{ctr}%</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          ad.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}>
                          {ad.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit(ad)}
                            title="Edit"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleStatus(ad._id, ad.isActive)}
                            title={ad.isActive ? "Deactivate" : "Activate"}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            {ad.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => deleteAd(ad._id)}
                            title="Delete"
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
