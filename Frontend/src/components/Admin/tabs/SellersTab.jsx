import { useState } from "react"
import { Search, Building2 } from "lucide-react"
import { statusBadge } from "../adminUtils"

export default function SellersTab({ sellers, renderText }) {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch]           = useState("")

  const filtered = sellers.filter(
    (s) =>
      (s.name   && renderText(s.name).toLowerCase().includes(search.toLowerCase()))   ||
      (s.email  && renderText(s.email).toLowerCase().includes(search.toLowerCase()))  ||
      (s.id     && renderText(s.id).toString().toLowerCase().includes(search.toLowerCase())) ||
      (s.status && renderText(s.status).toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Seller Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">{filtered.length} sellers</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search sellers…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <Building2 className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">
            {search ? "No sellers match your search" : "No sellers yet"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Seller ID", "Name", "Email", "Total Earnings", "Pending Payout", "Commission", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((seller) => (
                <tr key={seller.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-mono text-slate-500">
                    #{renderText(seller.id).toString().slice(-8)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-blue-600">
                          {renderText(seller.name).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{renderText(seller.name)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{renderText(seller.email)}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600 tabular-nums">
                    ₼ {renderText(seller.totalEarnings)}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-amber-600 tabular-nums">
                    ₼ {renderText(seller.pendingEarnings)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 tabular-nums">
                    {renderText(seller.commissionRate)}%
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadge(renderText(seller.status))}`}>
                      {renderText(seller.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
