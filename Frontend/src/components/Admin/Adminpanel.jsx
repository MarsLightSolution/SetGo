import { useState, useEffect } from "react"
import {
  LayoutDashboard, CreditCard, Users, ShoppingCart, Building2,
  Image as GalleryIcon, Megaphone, MessageSquare, Shield, RefreshCw,
  AlertTriangle, ChevronRight,
} from "lucide-react"
import { SERVER_URL, renderText } from "./adminUtils"
import DashboardTab from "./tabs/DashboardTab"
import TransactionsTab from "./tabs/TransactionsTab"
import BuyersTab from "./tabs/BuyersTab"
import OrdersTab from "./tabs/OrdersTab"
import SellersTab from "./tabs/SellersTab"
import GalleryTab from "./tabs/GalleryTab"
import AdsTab from "./tabs/AdsTab"
import QueriesTab from "./tabs/QueriesTab"

const NAV_ITEMS = [
  { key: "dashboard",     label: "Dashboard",        icon: LayoutDashboard },
  { key: "transactions",  label: "Transactions",      icon: CreditCard },
  { key: "buyers",        label: "Buyers",            icon: Users },
  { key: "orders",        label: "Orders",            icon: ShoppingCart },
  { key: "sellers",       label: "Sellers",           icon: Building2 },
  { key: "gallery",       label: "Boosted Products",  icon: GalleryIcon },
  { key: "ads",           label: "Advertisements",    icon: Megaphone },
  { key: "queries",       label: "Support Queries",   icon: MessageSquare },
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab]         = useState("dashboard")
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [queriesCount, setQueriesCount]   = useState(0)
  const [dashboardData, setDashboardData] = useState({
    stats: { totalRevenue: 0, activeBuyers: 0, pendingOrders: 0, fundsHeld: 0 },
    transactions: [],
    buyers: [],
    sellers: [],
    orders: [],
  })

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${SERVER_URL}/dashboard`)
      const result   = await response.json()
      if (result.success) {
        setDashboardData(result.data)
      } else {
        setError(result.error || "Failed to fetch data")
      }
    } catch (err) {
      setError("Network error: " + err.message)
      console.error("Dashboard API error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboardData() }, [])

  const handleApproveDelivery = async (orderId) => {
    try {
      const order = dashboardData.orders.find((o) => o.id === orderId)
      if (order && order.status === "shipped") {
        setDashboardData((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === orderId ? { ...o, deliveryApproved: true, status: "delivered" } : o,
          ),
        }))
        const response = await fetch(`${SERVER_URL}/${orderId}/approve-delivery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: import.meta.env.VITE_OWNER_ID }),
        })
        if (!response.ok) throw new Error("Failed to approve delivery")
        await fetchDashboardData()
      }
    } catch (err) {
      console.error("Error approving delivery:", err)
      setError("Failed to approve delivery")
      await fetchDashboardData()
    }
  }

  const handleReleaseFunds = async (orderId, to, transferTo) => {
    try {
      const order = dashboardData.orders.find((o) => o.id === orderId)
      if (order && (
        order.status === "delivered" ||
        order.status === "cancelled" ||
        order.status === "cancel" ||
        order.status.startsWith("funds_released_to_")
      )) {
        const orderTimestamp = Date.now()
        const payload = {
          senderId:      import.meta.env.VITE_OWNER_ID,
          receiverId:    to,
          type:          "transfer to " + transferTo,
          amount:        order.amount,
          transactionId: order.transactionId,
          description:   `Payment for order ${orderTimestamp} to ${transferTo}`,
          referenceId:   `order_${orderTimestamp}`,
          source:        "Admin wallet",
        }
        try {
          const res  = await fetch(`${SERVER_URL}/api/transaction/transferFund`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
          const data = await res.json().catch(() => ({}))
          if (res.ok) {
            const orderRes = await fetch(`${SERVER_URL}/${orderId}/release`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: import.meta.env.VITE_OWNER_ID }),
            })
            if (orderRes.ok) {
              alert("Funds released successfully to " + to)
              setDashboardData((prev) => ({
                ...prev,
                orders: prev.orders.map((o) =>
                  o.id === orderId
                    ? { ...o, status: "funds_released_to_" + transferTo, fundsReleasedToSeller: true }
                    : o,
                ),
                stats: {
                  ...prev.stats,
                  fundsHeld:     prev.stats.fundsHeld - Number.parseFloat(order.amount),
                  pendingOrders: prev.stats.pendingOrders - 1,
                },
              }))
            } else {
              alert("Transaction done but order update failed!")
            }
          } else {
            alert("Failed to release funds " + to)
          }
        } catch (err) {
          console.error(err)
        }
        await fetchDashboardData()
      }
    } catch (err) {
      console.error("Error releasing funds:", err)
      setError("Failed to release funds to seller")
      await fetchDashboardData()
    }
  }

  const handleCancelOrder = async (orderId) => {
    try {
      const order = dashboardData.orders.find((o) => o.id === orderId)
      if (
        order &&
        order.status !== "cancel" &&
        order.status !== "cancelled" &&
        order.status !== "delivered" &&
        order.status !== "funds_released"
      ) {
        setDashboardData((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === orderId ? { ...o, status: "cancelled", fundsReturned: true } : o,
          ),
          stats: {
            ...prev.stats,
            fundsHeld:     prev.stats.fundsHeld - Number.parseFloat(order.amount),
            pendingOrders: prev.stats.pendingOrders - 1,
          },
        }))
        const response = await fetch(`${SERVER_URL}/${orderId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: import.meta.env.VITE_OWNER_ID }),
        })
        if (!response.ok) throw new Error("Failed to cancel order")
        await fetchDashboardData()
      }
    } catch (err) {
      console.error("Error cancelling order:", err)
      setError("Failed to cancel order and return funds")
      await fetchDashboardData()
    }
  }

  const handleButtonClick = (callback) => async (...args) => {
    await callback(...args)
  }

  const currentNav = NAV_ITEMS.find((n) => n.key === activeTab)

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">Something went wrong</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ─── Main layout ──────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 bg-slate-900 flex flex-col h-full">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">SetGo Admin</p>
              <p className="text-slate-400 text-xs truncate">Marketplace Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
                {key === "queries" && queriesCount > 0 && (
                  <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                    isActive ? "bg-white/20 text-white" : "bg-blue-600 text-white"
                  }`}>
                    {queriesCount}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-slate-300 text-xs font-semibold truncate">Administrator</p>
              <p className="text-slate-500 text-xs truncate">Full access</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Top header */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-7 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {currentNav?.label ?? "Admin"}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">SetGo Marketplace Management</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-7">
          {activeTab === "dashboard"    && <DashboardTab dashboardData={dashboardData} renderText={renderText} />}
          {activeTab === "transactions" && <TransactionsTab transactions={dashboardData.transactions} renderText={renderText} />}
          {activeTab === "buyers"       && <BuyersTab buyers={dashboardData.buyers} renderText={renderText} />}
          {activeTab === "orders"       && (
            <OrdersTab
              orders={dashboardData.orders}
              renderText={renderText}
              onApproveDelivery={handleApproveDelivery}
              onReleaseFunds={handleReleaseFunds}
              onCancelOrder={handleCancelOrder}
              handleButtonClick={handleButtonClick}
            />
          )}
          {activeTab === "sellers"  && <SellersTab sellers={dashboardData.sellers} renderText={renderText} />}
          {activeTab === "gallery"  && <GalleryTab />}
          {activeTab === "ads"      && <AdsTab />}
          {activeTab === "queries"  && <QueriesTab onCountChange={setQueriesCount} />}
        </main>
      </div>
    </div>
  )
}
