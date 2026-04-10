export const SERVER_URL = import.meta.env.VITE_SERVER || "http://localhost:8080"

export const renderText = (text) => {
  if (typeof text === "string") return text
  if (typeof text === "object" && text !== null) {
    return text.en || text.az || text.ru || Object.values(text)[0] || "N/A"
  }
  return text === null || text === undefined ? "N/A" : String(text)
}

// Returns Tailwind badge classes based on status string
export const statusBadge = (status) => {
  const s = (status || "").toLowerCase()
  if (["active", "delivered", "resolved", "credit", "funds_released"].includes(s))
    return "bg-emerald-50 text-emerald-700 border border-emerald-200"
  if (["paid", "shipped", "in_progress"].includes(s))
    return "bg-sky-50 text-sky-700 border border-sky-200"
  if (["open", "pending"].includes(s))
    return "bg-amber-50 text-amber-700 border border-amber-200"
  if (["cancel", "cancelled", "debit", "closed"].includes(s))
    return "bg-red-50 text-red-700 border border-red-200"
  return "bg-slate-100 text-slate-600 border border-slate-200"
}
