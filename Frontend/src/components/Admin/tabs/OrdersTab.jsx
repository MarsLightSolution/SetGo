import { useState } from "react"
import { Search, ShoppingCart, CheckCircle, XCircle, DollarSign, RotateCcw, Clock } from "lucide-react"
import { statusBadge } from "../adminUtils"

export default function OrdersTab({ orders, renderText, onApproveDelivery, onReleaseFunds, onCancelOrder, handleButtonClick }) {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch]           = useState("")

  const filtered = orders.filter(
    (o) =>
      (o.id          && renderText(o.id).toString().toLowerCase().includes(search.toLowerCase()))          ||
      (o.buyerName   && renderText(o.buyerName).toLowerCase().includes(search.toLowerCase()))   ||
      (o.sellerName  && renderText(o.sellerName).toLowerCase().includes(search.toLowerCase()))  ||
      (o.productName && renderText(o.productName).toLowerCase().includes(search.toLowerCase())) ||
      (o.status      && renderText(o.status).toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Order Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">{filtered.length} orders</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders…"
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
            <ShoppingCart className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">
            {search ? "No orders match your search" : "No orders yet"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Order ID", "Buyer", "Seller", "Product", "Amount", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((order) => {
                const status = renderText(order.status)
                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono text-slate-500">
                      #{renderText(order.id).toString().slice(-8)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700">{renderText(order.buyerName)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-700">{renderText(order.sellerName)}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-900 max-w-[160px] truncate">
                      {renderText(order.productName)}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-900 tabular-nums">
                      ₼ {renderText(order.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadge(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1.5 min-w-[160px]">

                        {/* Waiting for shipping */}
                        {status === "paid" && (
                          <>
                            <span className="inline-flex items-center gap-1.5 text-xs text-sky-600 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg font-medium">
                              <Clock className="w-3 h-3" /> Awaiting Shipment
                            </span>
                            <button
                              onClick={handleButtonClick(() => onCancelOrder(order.id))}
                              className="inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg font-medium hover:bg-red-100 transition-colors"
                            >
                              <XCircle className="w-3 h-3" /> Cancel
                            </button>
                          </>
                        )}

                        {/* Shipped — approve or cancel */}
                        {status === "shipped" && (
                          <>
                            <button
                              onClick={handleButtonClick(() => onApproveDelivery(order.id))}
                              className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium hover:bg-emerald-100 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" /> Approve Delivery
                            </button>
                            <button
                              onClick={handleButtonClick(() => onCancelOrder(order.id))}
                              className="inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg font-medium hover:bg-red-100 transition-colors"
                            >
                              <XCircle className="w-3 h-3" /> Cancel
                            </button>
                          </>
                        )}

                        {/* Delivered — release to seller */}
                        {(status === "delivered" || status.includes("funds_released_to_")) &&
                          !status.includes("funds_released_to_Seller") && (
                            <button
                              onClick={handleButtonClick(() => onReleaseFunds(order.id, order.sellerId, "Seller"))}
                              className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium hover:bg-emerald-100 transition-colors"
                            >
                              <DollarSign className="w-3 h-3" /> Release to Seller
                            </button>
                          )}

                        {status.includes("funds_released_to_Seller") && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-medium">
                            <CheckCircle className="w-3 h-3" /> Released to Seller
                          </span>
                        )}

                        {/* Cancelled — return to buyer */}
                        {(status === "cancelled" || status.includes("funds_released_to_")) &&
                          !status.includes("funds_released_to_Buyer") && (
                            <button
                              onClick={handleButtonClick(() => onReleaseFunds(order.id, order.buyerId, "Buyer"))}
                              className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-medium hover:bg-amber-100 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" /> Return to Buyer
                            </button>
                          )}

                        {status.includes("funds_released_to_Buyer") && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-medium">
                            <CheckCircle className="w-3 h-3" /> Returned to Buyer
                          </span>
                        )}

                        {status === "pending" && (
                          <button
                            onClick={handleButtonClick(() => onCancelOrder(order.id))}
                            className="inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg font-medium hover:bg-red-100 transition-colors"
                          >
                            <XCircle className="w-3 h-3" /> Cancel
                          </button>
                        )}
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
  )
}
