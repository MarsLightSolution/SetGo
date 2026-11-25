import { useState } from "react"
import { Search, ShoppingCart, CheckCircle, XCircle, DollarSign, RotateCcw, Clock, AlertTriangle } from "lucide-react"
import { statusBadge } from "../adminUtils"

export default function OrdersTab({ orders, renderText, onApproveDelivery, onReleaseFunds, onCancelOrder, onRefundOrder, handleButtonClick }) {
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

                        {(() => {
                          const btn = "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors"
                          const red   = `${btn} text-red-600 bg-red-50 border-red-200 hover:bg-red-100`
                          const amber = `${btn} text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100`
                          const green = `${btn} text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100`
                          const tag   = (cls, Icon, text) => (
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium border ${cls}`}>
                              <Icon className="w-3 h-3" /> {text}
                            </span>
                          )
                          const paid          = order.paymentStatus === "completed"
                          const refundAtBank  = ["sending", "sent"].includes(order.refundStatus)
                          const refundBlocked = refundAtBank || order.paymentStatus === "processing"
                          const out = []

                          if (order.paymentStatus === "processing")
                            out.push(tag("text-amber-700 bg-amber-50 border-amber-200", Clock, "Payment being confirmed"))
                          if (order.needsReview)
                            out.push(tag("text-red-700 bg-red-50 border-red-200", AlertTriangle, "Needs review"))
                          if (refundAtBank)
                            out.push(tag("text-amber-700 bg-amber-50 border-amber-200", Clock, "Refund sent to bank"))
                          if (order.refundStatus === "declined")
                            out.push(tag("text-red-700 bg-red-50 border-red-200", XCircle, "Bank declined refund"))
                          if (order.paymentStatus === "refunded")
                            out.push(tag("text-slate-600 bg-slate-100 border-slate-200", RotateCcw, "Refunded to buyer"))

                          if (status === "paid") {
                            out.push(tag("text-sky-600 bg-sky-50 border-sky-200", Clock, "Awaiting Shipment"))
                          }
                          if (status === "shipped") {
                            out.push(
                              <button key="approve" onClick={handleButtonClick(() => onApproveDelivery(order.id))} className={green}>
                                <CheckCircle className="w-3 h-3" /> Approve Delivery
                              </button>,
                            )
                          }
                          if (status === "delivered") {
                            out.push(
                              <button key="release" onClick={handleButtonClick(() => onReleaseFunds(order.id))} className={green}>
                                <DollarSign className="w-3 h-3" /> Release to Seller
                              </button>,
                            )
                          }
                          if (status === "released") {
                            out.push(tag("text-slate-500 bg-slate-100 border-slate-200", CheckCircle, "Released to Seller"))
                          }

                          // Refund: admin only. Before delivery it is "Cancel & refund"; after, "Refund".
                          if (paid && !refundBlocked && ["paid", "shipped"].includes(status)) {
                            out.push(
                              <button key="cancel" onClick={handleButtonClick(() => onCancelOrder(order.id))} className={red}>
                                <XCircle className="w-3 h-3" /> Cancel &amp; Refund
                              </button>,
                            )
                          }
                          if (paid && !refundBlocked && ["delivered", "released"].includes(status)) {
                            out.push(
                              <button key="refund" onClick={handleButtonClick(() => onRefundOrder(order.id))} className={amber}>
                                <RotateCcw className="w-3 h-3" /> Refund
                              </button>,
                            )
                          }
                          if (status === "pending" && !paid && order.paymentStatus !== "processing") {
                            out.push(
                              <button key="cancel-unpaid" onClick={handleButtonClick(() => onCancelOrder(order.id))} className={red}>
                                <XCircle className="w-3 h-3" /> Cancel
                              </button>,
                            )
                          }
                          return out.map((el, i) => <span key={i} className="contents">{el}</span>)
                        })()}
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
