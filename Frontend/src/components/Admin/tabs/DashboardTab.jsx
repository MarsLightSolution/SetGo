import { TrendingUp, Users, ShoppingCart, Wallet, ArrowUpRight, Clock } from "lucide-react"
import { statusBadge } from "../adminUtils"

const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, badge }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      {badge && (
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          {badge}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
    <p className="text-sm text-slate-500 mt-1">{label}</p>
  </div>
)

export default function DashboardTab({ dashboardData, renderText }) {
  const { stats, transactions, orders } = dashboardData

  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "paid" || o.status === "shipped",
  )

  return (
    <div className="space-y-7">

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="Total Revenue"
          value={`₼ ${Number(renderText(stats.totalRevenue)).toLocaleString()}`}
          icon={TrendingUp}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          badge="+12%"
        />
        <StatCard
          label="Active Buyers"
          value={renderText(stats.activeBuyers)}
          icon={Users}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          badge="+3 new"
        />
        <StatCard
          label="Pending Orders"
          value={renderText(stats.pendingOrders)}
          icon={ShoppingCart}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Funds Held"
          value={`₼ ${Number(renderText(stats.fundsHeld)).toLocaleString()}`}
          icon={Wallet}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* ── Bottom two columns ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Transactions</h2>
            <span className="text-xs text-slate-400">{transactions.slice(0, 5).length} latest</span>
          </div>
          <div className="divide-y divide-slate-100">
            {transactions.slice(0, 5).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No transactions yet</p>
            ) : (
              transactions.slice(0, 5).map((t) => {
                const type   = renderText(t.type)
                const isCredit = type === "credit"
                return (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isCredit ? "bg-emerald-500" : "bg-red-400"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {renderText(t.description)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(t.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ml-4 ${isCredit ? "text-emerald-600" : "text-red-500"}`}>
                      {isCredit ? "+" : "−"}₼ {renderText(t.amount)}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Pending Actions</h2>
            <span className="text-xs text-slate-400">{pendingOrders.length} require attention</span>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingOrders.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-400">All caught up!</p>
              </div>
            ) : (
              pendingOrders.map((order) => {
                const status = renderText(order.status)
                return (
                  <div key={order.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {renderText(order.productName)}
                        </p>
                        <p className="text-xs text-slate-400">
                          #{renderText(order.id).toString().slice(-6)} · ₼ {renderText(order.amount)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ml-3 ${statusBadge(status)}`}>
                      {status}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
