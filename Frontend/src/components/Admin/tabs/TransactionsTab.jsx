import { useState } from "react"
import { Search, ArrowUpRight, ArrowDownLeft, FileText } from "lucide-react"
import { statusBadge } from "../adminUtils"

export default function TransactionsTab({ transactions, renderText }) {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch]           = useState("")

  const filtered = transactions.filter(
    (t) =>
      (t.description && renderText(t.description).toLowerCase().includes(search.toLowerCase())) ||
      (t.id          && renderText(t.id).toString().toLowerCase().includes(search.toLowerCase())) ||
      (t.type        && renderText(t.type).toLowerCase().includes(search.toLowerCase())) ||
      (t.amount      && renderText(t.amount).toString().includes(search)),
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Transaction History</h2>
          <p className="text-xs text-slate-400 mt-0.5">{filtered.length} records</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">
            {search ? "No transactions match your search" : "No transactions yet"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Transaction ID", "Type", "Amount", "Description", "Date", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => {
                const type     = renderText(t.type)
                const isCredit = type === "credit"
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono font-medium text-slate-700">
                      #{renderText(t.id).toString().slice(-8)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border ${statusBadge(type)}`}>
                        {isCredit
                          ? <ArrowUpRight className="w-3 h-3" />
                          : <ArrowDownLeft className="w-3 h-3" />}
                        {isCredit ? "Credit" : "Debit"}
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 text-sm font-bold tabular-nums ${isCredit ? "text-emerald-600" : "text-red-500"}`}>
                      {isCredit ? "+" : "−"}₼ {renderText(t.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 max-w-[220px] truncate">
                      {renderText(t.description)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadge(renderText(t.status))}`}>
                        {renderText(t.status)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
