import { useState, useEffect } from "react"
import {
  MessageSquare, Clock, CheckCircle, XCircle, X, Calendar,
  Lock, Edit3, Image as ImageIcon, Loader, ZoomIn, Package, Search,
} from "lucide-react"
import { SERVER_URL } from "../adminUtils"

const adminId = "60d5ec49f1b2c72b8c8e4f20"

const STATUS_CONFIG = {
  open:        { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: <Clock className="w-3.5 h-3.5" />,        label: "Open" },
  in_progress: { color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200",     icon: <Package className="w-3.5 h-3.5" />,      label: "In Progress" },
  resolved:    { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle className="w-3.5 h-3.5" />,   label: "Resolved" },
  closed:      { color: "text-slate-600",   bg: "bg-slate-100",  border: "border-slate-200",   icon: <XCircle className="w-3.5 h-3.5" />,      label: "Closed" },
}
const getStatusConfig = (s) => STATUS_CONFIG[s] || STATUS_CONFIG.open

const formatIssueType = (type) =>
  type?.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Unknown"

const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath
  return `${SERVER_URL}/${imagePath.startsWith("/") ? imagePath.slice(1) : imagePath}`
}

const STATUS_FILTERS = [
  { key: "all",         label: "All" },
  { key: "open",        label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved",    label: "Resolved" },
  { key: "closed",      label: "Closed" },
]

export default function QueriesTab({ onCountChange }) {
  const [queries, setQueries]                 = useState([])
  const [queriesLoading, setQueriesLoading]   = useState(false)
  const [searchInput, setSearchInput]         = useState("")
  const [querySearch, setQuerySearch]         = useState("")
  const [selectedQuery, setSelectedQuery]     = useState(null)
  const [showDetails, setShowDetails]         = useState(false)
  const [selectedImage, setSelectedImage]     = useState(null)
  const [showLightbox, setShowLightbox]       = useState(false)
  const [showCloseModal, setShowCloseModal]   = useState(false)
  const [closeMessage, setCloseMessage]       = useState("")
  const [closingQuery, setClosingQuery]       = useState(false)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [responseMessage, setResponseMessage] = useState("")
  const [sendingResponse, setSendingResponse] = useState(false)
  const [statusFilter, setStatusFilter]       = useState("all")

  const fetchQueries = async () => {
    try {
      setQueriesLoading(true)
      const response = await fetch(`${SERVER_URL}/concern/all`)
      const data     = await response.json()
      if (data.success) {
        const concerns = data.concerns || []
        setQueries(concerns)
        onCountChange(concerns.filter((c) => c.status === "open" || c.status === "in_progress").length)
      }
    } catch (err) {
      console.error("Failed to load queries:", err)
    } finally {
      setQueriesLoading(false)
    }
  }

  const fetchQueryDetails = async (concernId) => {
    try {
      const response = await fetch(`${SERVER_URL}/concern/${concernId}`)
      const data     = await response.json()
      if (data.success) { setSelectedQuery(data.data); setShowDetails(true) }
    } catch (err) {
      console.error("Error fetching query details:", err)
    }
  }

  const handleCloseQuery = async () => {
    if (!closeMessage.trim()) { alert("Please enter a closing message."); return }
    setClosingQuery(true)
    try {
      const response = await fetch(`${SERVER_URL}/concern/${selectedQuery._id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, adminMessage: closeMessage }),
      })
      const result = await response.json()
      if (result.success) {
        setShowCloseModal(false)
        setCloseMessage("")
        setShowDetails(false)
        fetchQueries()
      }
    } catch (err) {
      alert("Failed to close query.")
    } finally {
      setClosingQuery(false)
    }
  }

  const handleSendResponse = async () => {
    if (!responseMessage.trim()) { alert("Please enter a response."); return }
    setSendingResponse(true)
    try {
      const response = await fetch(`${SERVER_URL}/concern/${selectedQuery._id}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, message: responseMessage }),
      })
      const result = await response.json()
      if (result.success) {
        setShowResponseModal(false)
        setResponseMessage("")
        fetchQueryDetails(selectedQuery._id)
        fetchQueries()
      }
    } catch (err) {
      alert("Failed to send response.")
    } finally {
      setSendingResponse(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (!selectedQuery || !newStatus) return
    try {
      const response = await fetch(`${SERVER_URL}/concern/${selectedQuery._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const result = await response.json()
      if (result.success) { fetchQueryDetails(selectedQuery._id); fetchQueries() }
    } catch (err) {
      alert("Failed to update status.")
    }
  }

  useEffect(() => { fetchQueries() }, [])

  const countByStatus = (s) => s === "all" ? queries.length : queries.filter((q) => q.status === s).length

  const filtered =
    statusFilter === "all"
      ? queries.filter(
          (q) =>
            q.message?.toLowerCase().includes(querySearch.toLowerCase()) ||
            q.issueType?.toLowerCase().includes(querySearch.toLowerCase()) ||
            q.status?.toLowerCase().includes(querySearch.toLowerCase()),
        )
      : queries.filter(
          (q) =>
            q.status === statusFilter &&
            (q.message?.toLowerCase().includes(querySearch.toLowerCase()) ||
             q.issueType?.toLowerCase().includes(querySearch.toLowerCase())),
        )

  return (
    <div className="space-y-5">

      {/* ── Status filter tabs ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 flex gap-1 overflow-x-auto">
        {STATUS_FILTERS.map(({ key, label }) => {
          const isActive = statusFilter === key
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {countByStatus(key)}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Search ───────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by message, issue type, or status…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setQuerySearch(searchInput)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* ── Query list ───────────────────────────────────────────────── */}
      {queriesLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center py-16 gap-3">
          <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading queries…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center py-16 gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">No queries found</p>
          <p className="text-xs text-slate-400">
            {querySearch ? "Try different search terms" : "No support queries yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((query) => {
            const cfg = getStatusConfig(query.status)
            return (
              <div
                key={query.concernId || query._id}
                onClick={() => fetchQueryDetails(query.concernId || query._id)}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                        {formatIssueType(query.issueType)}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg.color} ${cfg.bg} border ${cfg.border} px-2.5 py-0.5 rounded-full`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {query.images?.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full">
                          <ImageIcon className="w-3 h-3" /> {query.images.length} image{query.images.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {/* Message */}
                    <p className="text-sm text-slate-700 line-clamp-2 mb-2">{query.message}</p>
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(query.createdAt).toLocaleDateString()}
                      </span>
                      {query.adminResponses?.length > 0 && (
                        <span className="flex items-center gap-1 text-blue-500">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {query.adminResponses.length} response{query.adminResponses.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {query.userId?.name && (
                        <span className="font-medium text-slate-500">User: {query.userId.name}</span>
                      )}
                    </div>
                  </div>
                  {/* Arrow indicator */}
                  <div className="shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          Query Details Modal
      ══════════════════════════════════════════════════════════════ */}
      {showDetails && selectedQuery && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl flex items-start justify-between z-10">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Query Details</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    {formatIssueType(selectedQuery.issueType)}
                  </span>
                  {(() => {
                    const cfg = getStatusConfig(selectedQuery.status)
                    return (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg.color} ${cfg.bg} border ${cfg.border} px-2.5 py-0.5 rounded-full`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    )
                  })()}
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* User message */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> User's Query
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed">{selectedQuery.message}</p>

                {/* Attachments */}
                {selectedQuery.images?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" /> Attachments ({selectedQuery.images.length})
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedQuery.images.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={(e) => { e.stopPropagation(); setSelectedImage(getImageUrl(img)); setShowLightbox(true) }}
                          className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer"
                        >
                          <img src={getImageUrl(img)} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <span><strong className="text-slate-600">Created:</strong> {new Date(selectedQuery.createdAt).toLocaleString()}</span>
                  <span><strong className="text-slate-600">Updated:</strong> {new Date(selectedQuery.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Admin responses */}
              {selectedQuery.adminResponses?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Admin Responses
                  </h4>
                  <div className="space-y-3">
                    {selectedQuery.adminResponses.map((r, idx) => (
                      <div key={idx} className="bg-blue-50 border border-blue-200 rounded-xl p-4 border-l-4 border-l-blue-500">
                        <p className="text-sm text-slate-700 leading-relaxed mb-2">{r.message}</p>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-semibold text-blue-600">{r.adminId?.name || "Admin"}</span>
                          <span>{new Date(r.respondedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {selectedQuery.status !== "closed" && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowResponseModal(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" /> Add Response
                    </button>
                    <button
                      onClick={() => setShowCloseModal(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <Lock className="w-4 h-4" /> Close Query
                    </button>
                  </div>
                  <select
                    onChange={(e) => handleStatusChange(e.target.value)}
                    value=""
                    className="w-full px-3 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Change Status…</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          Image Lightbox
      ══════════════════════════════════════════════════════════════ */}
      {showLightbox && selectedImage && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-[70] p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <img
            src={selectedImage}
            alt="Enlarged view"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          Response Modal
      ══════════════════════════════════════════════════════════════ */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" /> Add Response
              </h3>
              <button onClick={() => setShowResponseModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">Write a response that will be sent to the user.</p>
            <textarea
              rows={5}
              placeholder="Type your response here…"
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowResponseModal(false)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendResponse}
                disabled={!responseMessage.trim() || sendingResponse}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {sendingResponse ? "Sending…" : "Send Response"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          Close Query Modal
      ══════════════════════════════════════════════════════════════ */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-red-600 flex items-center gap-2">
                <Lock className="w-5 h-5" /> Close Query
              </h3>
              <button onClick={() => setShowCloseModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Write a closing message that will be sent to the user via email.
            </p>
            <textarea
              rows={5}
              placeholder="e.g. Your issue has been resolved. Thank you for your patience!"
              value={closeMessage}
              onChange={(e) => setCloseMessage(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowCloseModal(false)}
                disabled={closingQuery}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseQuery}
                disabled={!closeMessage.trim() || closingQuery}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {closingQuery ? "Closing…" : "Close & Notify User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
