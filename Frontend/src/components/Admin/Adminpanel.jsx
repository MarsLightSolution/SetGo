"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
// import { eventNames } from "../../../../backend/models/user"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState("")

  const [dashboardData, setDashboardData] = useState({
    stats: { totalRevenue: 0, activeBuyers: 0, pendingOrders: 0, fundsHeld: 0 },
    transactions: [],
    buyers: [],
    sellers: [],
    orders: [],
  })

  const [galleryData, setGalleryData] = useState([])
  const [galleryLoading, setGalleryLoading] = useState(false)

  const [transactionSearchInput, setTransactionSearchInput] = useState("")
  const [transactionSearch, setTransactionSearch] = useState("")
  const [buyerSearchInput, setBuyerSearchInput] = useState("")
  const [buyerSearch, setBuyerSearch] = useState("")
  const [orderSearchInput, setOrderSearchInput] = useState("")
  const [orderSearch, setOrderSearch] = useState("")
  const [sellerSearchInput, setSellerSearchInput] = useState("")
  const [sellerSearch, setSellerSearch] = useState("")
  const orderTimestamp = Date.now().toString()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_SERVER}/dashboard`)
      const result = await response.json()
      if (result.success) {
        setDashboardData(result.data)
      } else {
        setError(result.error || "Failed to fetch data")
      }
    } catch (err) {
      setError("Network error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchGalleryData = async () => {
    try {
      setGalleryLoading(true)
      const response = await fetch(`${import.meta.env.VITE_SERVER}/api/products/priority`)
      const result = await response.json()
      if (result.success) {
        const products = result.data.products || []
        const mappedProducts = products.map((product) => ({
          id: product._id,
          name: product.title,
          description: product.description,
          price: product.price,
          image:
            product.pictures && product.pictures.length > 0
              ? `${import.meta.env.VITE_SERVER}/${product.pictures[0]}`
              : null,
          stock: product.condition, // Using condition as stock info since no stock field
          category: product.category,
          location: product.location,
          owner: product.name || "Unknown",
        }))
        setGalleryData(mappedProducts)
      } else {
        setError(result.error || "Failed to fetch gallery data")
      }
    } catch (err) {
      setError("Network error: " + err.message)
    } finally {
      setGalleryLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [refreshTrigger])

  useEffect(() => {
    if (activeTab === "gallery") {
      fetchGalleryData()
    }
  }, [activeTab])

  const handleApproveDelivery = async (orderId) => {
    try {
      const order = dashboardData.orders.find((o) => o.id === orderId)

      if (order && order.status === "shipped") {
        // ✅ Optimistic UI update
        setDashboardData((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === orderId ? { ...o, deliveryApproved: true, status: "delivered" } : o,
          ),
        }))

        // ✅ Call backend with adminId
        const response = await fetch(`${import.meta.env.VITE_SERVER}/${orderId}/approve-delivery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: import.meta.env.VITE_OWNER_ID, // admin id
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to approve delivery")
        }

        await fetchDashboardData()
      }
    } catch (err) {
      setError("Failed to approve delivery")
      await fetchDashboardData()
    }
  }
  const handleReleaseFunds = async (orderId, to, transaferTo) => {
    try {
      const order = dashboardData.orders.find((o) => o.id === orderId)

      if (order && (order.status === "delivered" || order.status === "cancelled")) {
        const orderTimestamp = Date.now() // ✅ ensure unique referenceId
        const payload = {
          senderId: import.meta.env.VITE_OWNER_ID,
          receiverId: to,
          type: "transfer to " + transaferTo,
          amount: order.amount,
          transactionId: order.transactionId,
          description: `Payment for order ${orderTimestamp} to ${transaferTo}`,
          referenceId: `order_${orderTimestamp}`,
          source: "Admin wallet",
        }

        try {
          // Step 1: Transfer funds
          const res = await fetch(`${import.meta.env.VITE_SERVER}/api/transaction/transferFund`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
          const data = await res.json().catch(() => ({}))

          if (res.ok) {
            // ✅ Step 2: Update order as "funds released"
            const orderRes = await fetch(`${import.meta.env.VITE_SERVER}/${orderId}/release`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: import.meta.env.VITE_OWNER_ID }),
            })

            if (orderRes.ok) {
              toast.success("Funds released successfully to " + to)

              // Update frontend state
              setDashboardData((prev) => ({
                ...prev,
                orders: prev.orders.map((o) =>
                  o.id === orderId
                    ? { ...o, status: "funds_released_to_" + transaferTo, fundsReleasedToSeller: true }
                    : o,
                ),
                stats: {
                  ...prev.stats,
                  fundsHeld: prev.stats.fundsHeld - Number.parseFloat(order.amount),
                  pendingOrders: prev.stats.pendingOrders - 1,
                },
              }))
              setRefreshTrigger((prev) => prev + 1)
            } else {
              toast.error("Transaction done but order update failed!")
            }
          } else {
            toast.error("Failed to release funds " + to)
            setStatus("FAILURE")
          }
        } catch (err) {
          setStatus("FAILURE")
        }
        await fetchDashboardData()
      }
    } catch (err) {
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
        // Optimistic UI update
        setDashboardData((prev) => ({
          ...prev,
          orders: prev.orders.map((o) => (o.id === orderId ? { ...o, status: "cancel", fundsReturned: true } : o)),
          stats: {
            ...prev.stats,
            fundsHeld: prev.stats.fundsHeld - Number.parseFloat(order.amount),
            pendingOrders: prev.stats.pendingOrders - 1,
          },
        }))

        // 🔑 Send userId in request body
        const response = await fetch(`${import.meta.env.VITE_SERVER}/${orderId}/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: import.meta.env.VITE_OWNER_ID, // ✅ Admin userId
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to cancel order")
        }

        await fetchDashboardData()
      }
    } catch (err) {
      setError("Failed to cancel order and return funds")
      await fetchDashboardData()
    }
  }
  const renderText = (text) => {
    if (typeof text === "string") {
      return text
    }
    if (typeof text === "object" && text !== null) {
      const result = text.en || text.az || text.ru || Object.values(text)[0] || "N/A"
      return result
    }
    if (text === null || text === undefined) {
      return "N/A"
    }
    return String(text)
  }

  const filteredTransactions = dashboardData.transactions.filter(
    (transaction) =>
      (transaction.description &&
        renderText(transaction.description).toLowerCase().includes(transactionSearch.toLowerCase())) ||
      (transaction.id &&
        renderText(transaction.id).toString().toLowerCase().includes(transactionSearch.toLowerCase())) ||
      (transaction.type && renderText(transaction.type).toLowerCase().includes(transactionSearch.toLowerCase())) ||
      (transaction.amount && renderText(transaction.amount).toString().includes(transactionSearch)),
  )

  const filteredBuyers = dashboardData.buyers.filter(
    (buyer) =>
      (buyer.name && renderText(buyer.name).toLowerCase().includes(buyerSearch.toLowerCase())) ||
      (buyer.email && renderText(buyer.email).toLowerCase().includes(buyerSearch.toLowerCase())) ||
      (buyer.id && renderText(buyer.id).toString().toLowerCase().includes(buyerSearch.toLowerCase())) ||
      (buyer.status && renderText(buyer.status).toLowerCase().includes(buyerSearch.toLowerCase())),
  )

  const filteredOrders = dashboardData.orders.filter(
    (order) =>
      (order.id && renderText(order.id).toString().toLowerCase().includes(orderSearch.toLowerCase())) ||
      (order.buyerName && renderText(order.buyerName).toLowerCase().includes(orderSearch.toLowerCase())) ||
      (order.sellerName && renderText(order.sellerName).toLowerCase().includes(orderSearch.toLowerCase())) ||
      (order.productName && renderText(order.productName).toLowerCase().includes(orderSearch.toLowerCase())) ||
      (order.status && renderText(order.status).toLowerCase().includes(orderSearch.toLowerCase())),
  )

  const filteredSellers = dashboardData.sellers.filter(
    (seller) =>
      (seller.name && renderText(seller.name).toLowerCase().includes(sellerSearch.toLowerCase())) ||
      (seller.email && renderText(seller.email).toLowerCase().includes(sellerSearch.toLowerCase())) ||
      (seller.id && renderText(seller.id).toString().toLowerCase().includes(sellerSearch.toLowerCase())) ||
      (seller.status && renderText(seller.status).toLowerCase().includes(sellerSearch.toLowerCase())),
  )

  const Card = ({ children, className = "" }) => (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  )

  const CardHeader = ({ children, className = "" }) => (
    <div className={`px-6 py-5 border-b border-gray-100 ${className}`}>{children}</div>
  )

  const CardContent = ({ children, className = "" }) => <div className={`px-6 py-5 ${className}`}>{children}</div>

  const CardTitle = ({ children, className = "" }) => (
    <h3 className={`text-xl font-bold text-gray-900 ${className}`}>{children}</h3>
  )

  const CardDescription = ({ children, className = "" }) => (
    <p className={`text-sm text-gray-500 mt-2 ${className}`}>{children}</p>
  )

  const Button = ({ children, onClick, variant = "default", size = "default", className = "", disabled = false }) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transform hover:scale-105 active:scale-95"
    const variants = {
      default:
        "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-lg",
      outline:
        "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500 shadow-md",
      secondary:
        "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 hover:from-gray-200 hover:to-gray-300 focus:ring-gray-500 shadow-md",
    }
    const sizes = {
      default: "px-6 py-3 text-sm",
      sm: "px-4 py-2 text-xs",
    }

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      >
        {children}
      </button>
    )
  }

  const SearchInput = ({ placeholder, value, onChange, onKeyPress, className = "" }) => (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onKeyPress) {
            onKeyPress(e)
          }
        }}
        className={`w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white ${className}`}
      />
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  )

  const Badge = ({ children, variant = "default", className = "" }) => {
    const variants = {
      default: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300",
      secondary: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300",
      outline: "border-2 border-gray-300 bg-white text-gray-700",
    }

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
      >
        {children}
      </span>
    )
  }

  const TabButton = ({ isActive, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 ${
        isActive
          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white shadow-md"
      }`}
    >
      {children}
    </button>
  )

  const Table = ({ children, className = "" }) => (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>{children}</table>
    </div>
  )

  const TableHeader = ({ children }) => <thead className="bg-gradient-to-r from-gray-50 to-gray-100">{children}</thead>

  const TableBody = ({ children }) => <tbody className="bg-white divide-y divide-gray-100">{children}</tbody>

  const TableRow = ({ children, className = "" }) => (
    <tr
      className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${className}`}
    >
      {children}
    </tr>
  )

  const TableHead = ({ children, className = "" }) => (
    <th className={`px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  )

  const TableCell = ({ children, className = "" }) => (
    <td className={`px-6 py-4 whitespace-nowrap text-sm ${className}`}>{children}</td>
  )

  const handleTransactionSearch = (e) => {
    if (e.key === "Enter") {
      setTransactionSearch(transactionSearchInput)
    }
  }

  const handleBuyerSearch = (e) => {
    if (e.key === "Enter") {
      setBuyerSearch(buyerSearchInput)
    }
  }

  const handleOrderSearch = (e) => {
    if (e.key === "Enter") {
      setOrderSearch(orderSearchInput)
    }
  }

  const handleSellerSearch = (e) => {
    if (e.key === "Enter") {
      setSellerSearch(sellerSearchInput)
    }
  }

  const clearTransactionSearch = () => {
    setTransactionSearchInput("")
    setTransactionSearch("")
  }

  const clearBuyerSearch = () => {
    setBuyerSearchInput("")
    setBuyerSearch("")
  }

  const clearOrderSearch = () => {
    setOrderSearchInput("")
    setOrderSearch("")
  }

  const clearSellerSearch = () => {
    setSellerSearchInput("")
    setSellerSearch("")
  }

  const isFundsReleased = (status) => {
    return status.includes("funds_released_to_")
  }

  const handleButtonClick = (callback) => {
    return async (...args) => {
      await callback(...args)
      setRefreshTrigger((prev) => prev + 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl text-red-600 font-medium mb-4">Error loading dashboard: {error}</p>
          <Button onClick={() => (window.location.href = `${import.meta.env.VITE_FRONTEND}/adminpanel`)}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-3">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600 font-medium">Comprehensive marketplace management system</p>
        </div>

        <div className="mb-10">
          <div className="flex flex-wrap gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xl">
            <TabButton isActive={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>
              📊 Dashboard
            </TabButton>
            <TabButton isActive={activeTab === "transactions"} onClick={() => setActiveTab("transactions")}>
              💳 Transactions
            </TabButton>
            <TabButton isActive={activeTab === "buyers"} onClick={() => setActiveTab("buyers")}>
              👥 Buyers
            </TabButton>
            <TabButton isActive={activeTab === "orders"} onClick={() => setActiveTab("orders")}>
              📦 Orders
            </TabButton>
            <TabButton isActive={activeTab === "sellers"} onClick={() => setActiveTab("sellers")}>
              🏪 Sellers
            </TabButton>
            <TabButton isActive={activeTab === "gallery"} onClick={() => setActiveTab("gallery")}>
              🖼️ Gallery
            </TabButton>
          </div>
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 text-white border-0 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-emerald-400">
                  <CardTitle className="text-sm font-bold text-emerald-100">Total Revenue</CardTitle>
                  <div className="text-3xl">💰</div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-white">
                    ₼ {renderText(dashboardData.stats.totalRevenue).toLocaleString()}
                  </div>
                  <p className="text-sm text-emerald-100 mt-2 font-medium">+12% from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 text-white border-0 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-blue-400">
                  <CardTitle className="text-sm font-bold text-blue-100">Active Buyers</CardTitle>
                  <div className="text-3xl">👥</div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-white">{renderText(dashboardData.stats.activeBuyers)}</div>
                  <p className="text-sm text-blue-100 mt-2 font-medium">+3 new this week</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 text-white border-0 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-orange-400">
                  <CardTitle className="text-sm font-bold text-orange-100">Pending Orders</CardTitle>
                  <div className="text-3xl">📦</div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-white">{renderText(dashboardData.stats.pendingOrders)}</div>
                  <p className="text-sm text-orange-100 mt-2 font-medium">Awaiting delivery</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 text-white border-0 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-purple-400">
                  <CardTitle className="text-sm font-bold text-purple-100">Funds Held</CardTitle>
                  <div className="text-3xl">🏦</div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-white">
                    ₼ {renderText(dashboardData.stats.fundsHeld).toLocaleString()}
                  </div>
                  <p className="text-sm text-purple-100 mt-2 font-medium">Pending release</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Recent Transactions</CardTitle>
                  <CardDescription className="text-base">Latest payment activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.transactions.slice(0, 5).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-4 h-4 rounded-full shadow-lg ${
                              renderText(transaction.type) === "credit"
                                ? "bg-gradient-to-r from-green-400 to-green-600"
                                : "bg-gradient-to-r from-red-400 to-red-600"
                            }`}
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{renderText(transaction.description)}</p>
                            <p className="text-xs text-gray-500 font-medium">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`text-sm font-black ${
                            renderText(transaction.type) === "credit" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {renderText(transaction.type) === "credit" ? "+" : "-"}₼ {renderText(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Pending Actions</CardTitle>
                  <CardDescription className="text-base">Orders requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.orders
                      .filter((o) => o.status === "pending" || o.status === "paid" || o.status === "shipped")
                      .map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200 hover:shadow-lg transition-all duration-200"
                        >
                          <div>
                            <p className="text-sm font-bold text-gray-900">{renderText(order.productName)}</p>
                            <p className="text-xs text-gray-600 font-medium">
                              Order {renderText(order.id).toString().slice(-6)} - ₼ {renderText(order.amount)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-orange-700 border-orange-500 bg-orange-100 font-bold"
                          >
                            {renderText(order.status)}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="space-y-8">
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">Transaction History</CardTitle>
                <CardDescription className="text-base">Complete record of all financial transactions</CardDescription>
                <div className="flex items-center space-x-4 mt-6">
                  <SearchInput
                    placeholder="Search by ID, description, type, or amount... (Press Enter to search)"
                    value={transactionSearchInput}
                    onChange={setTransactionSearchInput}
                    onKeyPress={handleTransactionSearch}
                    className="max-w-lg"
                  />
                  {transactionSearch && (
                    <Button variant="outline" size="sm" onClick={clearTransactionSearch}>
                      ✕ Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {transactionSearch && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-800 font-semibold">
                      Found {filteredTransactions.length} transaction(s) matching "{transactionSearch}"
                    </p>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-bold text-gray-900">
                          {renderText(transaction.id).toString().slice(-6)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={renderText(transaction.type) === "credit" ? "default" : "secondary"}
                            className="font-semibold"
                          >
                            {renderText(transaction.type) === "credit" ? "Credit" : "Debit"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`font-black text-lg ${renderText(transaction.type) === "credit" ? "text-green-600" : "text-red-600"}`}
                        >
                          {renderText(transaction.type) === "credit" ? "+" : "-"}₼ {renderText(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-gray-700 font-medium">
                          {renderText(transaction.description)}
                        </TableCell>
                        <TableCell className="text-gray-600 font-medium">
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-green-700 border-green-500 bg-green-50 font-semibold"
                          >
                            {renderText(transaction.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredTransactions.length === 0 && transactionSearch && (
                  <div className="text-center py-16 text-gray-500">
                    <div className="text-6xl mb-6">🔍</div>
                    <p className="text-lg font-semibold">No transactions found matching your search criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "buyers" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Buyer Management</CardTitle>
                <CardDescription>Manage registered buyers and their activities</CardDescription>
                <div className="flex items-center space-x-2 mt-4">
                  <SearchInput
                    placeholder="🔍 Search by name, email, ID, or status... (Press Enter to search)"
                    value={buyerSearchInput}
                    onChange={setBuyerSearchInput}
                    onKeyPress={handleBuyerSearch}
                    className="max-w-md"
                  />
                  {buyerSearch && (
                    <Button variant="outline" size="sm" onClick={clearBuyerSearch}>
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {buyerSearch && (
                  <p className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg">
                    Found {filteredBuyers.length} buyer(s) matching "{buyerSearch}"
                  </p>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Buyer ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Join Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBuyers.map((buyer) => (
                      <TableRow key={buyer.id}>
                        <TableCell className="font-medium text-gray-900">
                          {renderText(buyer.id).toString().slice(-6)}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">{renderText(buyer.name)}</TableCell>
                        <TableCell className="text-gray-600">{renderText(buyer.email)}</TableCell>
                        <TableCell className="text-green-600 font-bold">₼ {renderText(buyer.totalSpent)}</TableCell>
                        <TableCell className="text-gray-700">{renderText(buyer.totalOrders)}</TableCell>
                        <TableCell>
                          <Badge variant={renderText(buyer.status) === "active" ? "default" : "secondary"}>
                            {renderText(buyer.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{new Date(buyer.joinDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredBuyers.length === 0 && buyerSearch && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">👥</div>
                    <p>No buyers found matching your search criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-8">
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">Order Management</CardTitle>
                <CardDescription className="text-base">Manage orders and fund releases</CardDescription>
                <div className="flex items-center space-x-4 mt-6">
                  <SearchInput
                    placeholder="Search by order ID, buyer, seller, product, or status... (Press Enter to search)"
                    value={orderSearchInput}
                    onChange={setOrderSearchInput}
                    onKeyPress={handleOrderSearch}
                    className="max-w-lg"
                  />
                  {orderSearch && (
                    <Button variant="outline" size="sm" onClick={clearOrderSearch}>
                      ✕ Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {orderSearch && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-800 font-semibold">
                      Found {filteredOrders.length} order(s) matching "{orderSearch}"
                    </p>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-bold text-gray-900">
                          {renderText(order.id).toString().slice(-6)}
                        </TableCell>
                        <TableCell className="text-gray-700 font-medium">{renderText(order.buyerName)}</TableCell>
                        <TableCell className="text-gray-700 font-medium">{renderText(order.sellerName)}</TableCell>
                        <TableCell className="font-bold text-gray-900">{renderText(order.productName)}</TableCell>
                        <TableCell className="font-black text-lg text-gray-900">₼ {renderText(order.amount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              renderText(order.status) === "delivered"
                                ? "default"
                                : renderText(order.status) === "shipped" || renderText(order.status) === "paid"
                                  ? "secondary"
                                  : renderText(order.status) === "cancel" || renderText(order.status) === "cancelled"
                                    ? "outline"
                                    : "outline"
                            }
                            className={
                              renderText(order.status) === "delivered"
                                ? "bg-green-100 text-green-800 border-green-300 font-semibold"
                                : renderText(order.status) === "shipped" || renderText(order.status) === "paid"
                                  ? "bg-orange-100 text-orange-800 border-orange-300 font-semibold"
                                  : renderText(order.status) === "cancel" || renderText(order.status) === "cancelled"
                                    ? "bg-red-100 text-red-800 border-red-300 font-semibold"
                                    : "font-semibold"
                            }
                          >
                            {renderText(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 font-medium">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-3">
                            {renderText(order.status) === "paid" && (
                              <>
                                <Badge
                                  variant="outline"
                                  className="text-blue-700 border-blue-500 bg-blue-50 font-semibold"
                                >
                                  ⏳ Wait for Shipping
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={handleButtonClick(() => handleCancelOrder(order.id))}
                                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold"
                                >
                                  ❌ Cancel Order
                                </Button>
                              </>
                            )}

                            {renderText(order.status) === "shipped" && (
                              <>
                                <Badge
                                  variant="outline"
                                  className="text-orange-700 border-orange-500 bg-orange-100 font-semibold"
                                >
                                  ⏳ Wait for Delivery
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={handleButtonClick(() => handleApproveDelivery(order.id))}
                                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
                                >
                                  ✅ Approve Delivery
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleButtonClick(() => handleCancelOrder(order.id))}
                                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold"
                                >
                                  ❌ Cancel Order
                                </Button>
                              </>
                            )}

                            {(renderText(order.status) === "delivered" ||
                              order.status.includes("funds_released_to_")) &&
                              !order.status.includes("funds_released_to_Seller") && (
                                <Button
                                  size="sm"
                                  onClick={handleButtonClick(() =>
                                    handleReleaseFunds(order.id, order.sellerId, "Seller"),
                                  )}
                                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
                                >
                                  💰 Release Funds to Seller
                                </Button>
                              )}

                            {order.status.includes("funds_released_to_Seller") && (
                              <Button
                                size="sm"
                                disabled
                                className="bg-gray-400 text-gray-600 cursor-not-allowed font-semibold"
                              >
                                ✅ Funds Released to Seller
                              </Button>
                            )}

                            {(renderText(order.status) === "cancelled" ||
                              renderText(order.status) === "cancel" ||
                              order.status.includes("funds_released_to_")) &&
                              !order.status.includes("funds_released_to_Buyer") && (
                                <Button
                                  size="sm"
                                  onClick={handleButtonClick(() =>
                                    handleReleaseFunds(order.id, order.buyerId, "Buyer"),
                                  )}
                                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold"
                                >
                                  🔄 Return Funds to Buyer
                                </Button>
                              )}

                            {order.status.includes("funds_released_to_Buyer") && (
                              <Button
                                size="sm"
                                disabled
                                className="bg-gray-400 text-gray-600 cursor-not-allowed font-semibold"
                              >
                                ✅ Funds Returned to Buyer
                              </Button>
                            )}

                            {renderText(order.status) === "pending" && (
                              <Button
                                size="sm"
                                onClick={handleButtonClick(() => handleCancelOrder(order.id))}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold"
                              >
                                ❌ Cancel Order
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredOrders.length === 0 && orderSearch && (
                  <div className="text-center py-16 text-gray-500">
                    <div className="text-6xl mb-6">📦</div>
                    <p className="text-lg font-semibold">No orders found matching your search criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "sellers" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seller Management</CardTitle>
                <CardDescription>Manage sellers and their payouts</CardDescription>
                <div className="flex items-center space-x-2 mt-4">
                  <SearchInput
                    placeholder="🔍 Search by name, email, ID, or status... (Press Enter to search)"
                    value={sellerSearchInput}
                    onChange={setSellerSearchInput}
                    onKeyPress={handleSellerSearch}
                    className="max-w-md"
                  />
                  {sellerSearch && (
                    <Button variant="outline" size="sm" onClick={clearSellerSearch}>
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {sellerSearch && (
                  <p className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg">
                    Found {filteredSellers.length} seller(s) matching "{sellerSearch}"
                  </p>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Total Earnings</TableHead>
                      <TableHead>Pending Payouts</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSellers.map((seller) => (
                      <TableRow key={seller.id}>
                        <TableCell className="font-medium text-gray-900">
                          {renderText(seller.id).toString().slice(-6)}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">{renderText(seller.name)}</TableCell>
                        <TableCell className="text-gray-600">{renderText(seller.email)}</TableCell>
                        <TableCell className="text-green-600 font-bold">₼ {renderText(seller.totalEarnings)}</TableCell>
                        <TableCell className="text-orange-600 font-bold">
                          ₼ {renderText(seller.pendingEarnings)}
                        </TableCell>
                        <TableCell className="text-gray-700">{renderText(seller.commissionRate)}%</TableCell>
                        <TableCell>
                          <Badge variant={renderText(seller.status) === "active" ? "default" : "secondary"}>
                            {renderText(seller.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredSellers.length === 0 && sellerSearch && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">🏪</div>
                    <p>No sellers found matching your search criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "gallery" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Product Gallery</h2>
              <button
                onClick={fetchGalleryData}
                disabled={galleryLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              >
                {galleryLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Refreshing...
                  </>
                ) : (
                  <>🔄 Refresh Gallery</>
                )}
              </button>
            </div>

            {galleryLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {galleryData.length > 0 ? (
                  galleryData.map((product, index) => (
                    <div
                      key={product.id || index}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                    >
                      {product.image && (
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name || "Product"}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-2">{product.name || "Unnamed Product"}</h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {product.description || "No description available"}
                        </p>
                        <div className="text-xs text-gray-500 mb-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">{product.category}</span>
                          <span>by {product.owner}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-green-600">₼ {product.price || "0.00"}</span>
                          <span className="text-sm text-gray-500">Condition: {product.stock || "Unknown"}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Products Found</h3>
                    <p className="text-gray-500">Click the refresh button to load products from the database.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
