import { useState } from "react"
import { Search, Users } from "lucide-react"
import { statusBadge } from "../adminUtils"

export default function BuyersTab({ buyers, renderText }) {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch]           = useState("")

  const filtered = buyers.filter(
    (b) =>
      (b.name   && renderText(b.name).toLowerCase().includes(search.toLowerCase()))   ||
      (b.email  && renderText(b.email).toLowerCase().includes(search.toLowerCase()))  ||
      (b.id     && renderText(b.id).toString().toLowerCase().includes(search.toLowerCase())) ||
      (b.status && renderText(b.status).toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Buyer Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">{filtered.length} buyers</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search buyers…"
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
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">
            {search ? "No buyers match your search" : "No buyers yet"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Buyer ID", "Name", "Email", "Total Spent", "Orders", "Status", "Joined"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((buyer) => (
                <tr key={buyer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-mono text-slate-500">
                    #{renderText(buyer.id).toString().slice(-8)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-violet-600">
                          {renderText(buyer.name).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{renderText(buyer.name)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{renderText(buyer.email)}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600 tabular-nums">
                    ₼ {renderText(buyer.totalSpent)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 tabular-nums">
                    {renderText(buyer.totalOrders)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadge(renderText(buyer.status))}`}>
                      {renderText(buyer.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                    {new Date(buyer.joinDate).toLocaleDateString()}
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
