"use client"

import { useState, useEffect } from "react"
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
      console.log(result)
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

  const fetchQueryDetails = async (concernId) => {
    try {
      const response = await fetch(`${SERVER_URL}/concern/${concernId}?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setSelectedQuery(data.data)
        setShowQueryDetails(true)
      }
    } catch (error) {
      console.error("Error fetching query details:", error)
    }
  }

  const handleCloseQueryWithMessage = async () => {
    if (!closeMessage.trim()) {
      alert("Please enter a closing message.")
      return
    }

    setClosingQuery(true)
    try {
      const response = await fetch(`${SERVER_URL}/concern/${selectedQuery._id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: adminId,
          adminMessage: closeMessage
        })
      })

      const result = await response.json()

      if (result.success) {
        alert("✅ Query closed successfully!")
        setShowCloseModal(false)
        setCloseMessage("")
        setShowQueryDetails(false)
        fetchQueries()
      }
    } catch (err) {
      alert("❌ Failed to close query.")
    } finally {
      setClosingQuery(false)
    }
  }

  const handleSendAdminResponse = async () => {
    if (!responseMessage.trim()) {
      alert("Please enter a response.")
      return
    }

    setSendingResponse(true)
    try {
      const response = await fetch(`${SERVER_URL}/concern/${selectedQuery._id}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: adminId,
          message: responseMessage
        })
      })

      const result = await response.json()

      if (result.success) {
        alert("✅ Response sent!")
        setShowResponseModal(false)
        setResponseMessage("")
        fetchQueryDetails(selectedQuery._id)
        fetchQueries()
      }
    } catch (err) {
      alert("❌ Failed to send response.")
    } finally {
      setSendingResponse(false)
    }
  }
 const handleUnboost = async (productId) => {
  try {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to unboost this product?');
    if (!confirmed) return;

    // API call to unboost the product
   const response = await fetch(`${import.meta.env.VITE_SERVER}/api/products/priority/${productId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
});

    if (!response.ok) {
      throw new Error('Failed to unboost product');
    }

    // Show success message
    alert('Product unboosted successfully!');
    
    // Refresh gallery to reflect changes
    await fetchGalleryData();
  } catch (error) {
    console.error('Error unboosting product:', error);
    alert('Failed to unboost product. Please try again.');
  }
};
  const handleStatusChange = async (newStatus) => {
    if (!selectedQuery || !newStatus) return

    try {
      const response = await fetch(`${SERVER_URL}/concern/${selectedQuery._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`✅ Status updated to ${newStatus}`)
        fetchQueryDetails(selectedQuery._id)
        fetchQueries()
      }
    } catch (err) {
      alert("❌ Failed to update status.")
    }
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath
    }
    const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath
    return `${SERVER_URL}/${cleanPath}`
  }

  const handleImageClick = (imagePath) => {
    const fullUrl = getImageUrl(imagePath)
    setSelectedImage(fullUrl)
    setShowImageLightbox(true)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (activeTab === "queries") {
      fetchQueries()
    }
  }, [activeTab])

  const getStatusConfig = (status) => {
    const configs = {
      open: { 
        color: "text-orange-700", 
        bg: "bg-orange-50", 
        border: "border-orange-200",
        icon: <Clock className="w-4 h-4" />,
        label: "Open"
      },
      in_progress: { 
        color: "text-blue-700", 
        bg: "bg-blue-50", 
        border: "border-blue-200",
        icon: <Package className="w-4 h-4" />,
        label: "In Progress"
      },
      resolved: { 
        color: "text-emerald-700", 
        bg: "bg-emerald-50", 
        border: "border-emerald-200",
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Resolved"
      },
      closed: { 
        color: "text-gray-700", 
        bg: "bg-gray-50", 
        border: "border-gray-200",
        icon: <XCircle className="w-4 h-4" />,
        label: "Closed"
      }
    }
    return configs[status] || configs.open
  }

  const formatIssueType = (type) => {
    return type?.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "Unknown"
  }

  const getQueryCount = (status) => {
    return status === "all" ? queries.length : queries.filter(q => q.status === status).length
  }

  const filteredQueries = queryStatusFilter === "all" 
    ? queries.filter(q => 
        q.message?.toLowerCase().includes(querySearch.toLowerCase()) ||
        q.issueType?.toLowerCase().includes(querySearch.toLowerCase()) ||
        q.status?.toLowerCase().includes(querySearch.toLowerCase())
      )
    : queries.filter(q => 
        q.status === queryStatusFilter &&
        (q.message?.toLowerCase().includes(querySearch.toLowerCase()) ||
        q.issueType?.toLowerCase().includes(querySearch.toLowerCase()))
      )
  const fetchGalleryData = async () => {
    try {
      setGalleryLoading(true)
      const response = await fetch(`${import.meta.env.VITE_SERVER}/api/products/priority`)
      const result = await response.json()
      console.log("Gallery data:", result)
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
      console.error("Gallery API error:", err)
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
      console.error("Error approving delivery:", err)
      setError("Failed to approve delivery")
      await fetchDashboardData()
    }
  }
  const handleReleaseFunds = async (orderId, to, transaferTo) => {
    try {
      const order = dashboardData.orders.find((o) => o.id === orderId)
      console.log(order)

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

        console.log(payload)

        try {
          // Step 1: Transfer funds
          const res = await fetch(`${import.meta.env.VITE_SERVER}/api/transaction/transferFund`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
          const data = await res.json().catch(() => ({}))
          console.log(data)

          if (res.ok) {
            // ✅ Step 2: Update order as "funds released"
            const orderRes = await fetch(`${import.meta.env.VITE_SERVER}/${orderId}/release`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: import.meta.env.VITE_OWNER_ID }),
            })

            if (orderRes.ok) {
              alert("Funds released successfully to " + to)

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
              alert("Transaction done but order update failed!")
            }
          } else {
            alert("Failed to release funds " + to)
            setStatus("FAILURE")
          }
        } catch (err) {
          console.error(err)
          setStatus("FAILURE")
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
      console.error("Error cancelling order:", err)
      setError("Failed to cancel order and return funds")
      await fetchDashboardData()
    }
  }
  const renderText = (text) => {
    console.log("[v0] renderText called with:", text, "type:", typeof text)
    if (typeof text === "string") {
      return text
    }
    if (typeof text === "object" && text !== null) {
      console.log("[v0] Found object with keys:", Object.keys(text))
      const result = text.en || text.az || text.ru || Object.values(text)[0] || "N/A"
      console.log("[v0] Extracted text:", result)
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
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Boosted Products Gallery</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {galleryData.length} boosted {galleryData.length === 1 ? 'product' : 'products'}
                </p>
              </div>
              <button
                onClick={fetchGalleryData}
                disabled={galleryLoading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {galleryLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Gallery
                  </>
                )}
              </button>
            </div>

            {galleryLoading ? (
              <div className="flex flex-col justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
                <p className="text-gray-600 font-medium">Loading boosted products...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {galleryData.length > 0 ? (
                  galleryData.map((product, index) => (
                    <div
                      key={product.id || index}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                    >
                      <div className="relative">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name || "Product"}
                            className="w-full h-56 object-cover"
                          />
                        ) : (
                          <div className="w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Boosted
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 mb-2 text-lg line-clamp-2 min-h-[3.5rem]">
                          {product.name || "Unnamed Product"}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
                          {product.description || "No description available"}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {product.category}
                          </span>
                          <span className="inline-flex items-center bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-xs">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {product.owner}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Price</p>
                            <span className="text-2xl font-bold text-green-600">₼ {product.price || "0.00"}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Condition</p>
                            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                              {product.stock || "Unknown"}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleUnboost(product.id)}
                          className="w-full py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                          </svg>
                          Unboost Product
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full">
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300 text-center py-16 px-6">
                      <div className="text-7xl mb-4">⭐</div>
                      <h3 className="text-2xl font-bold text-gray-700 mb-2">No Boosted Products</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        There are currently no boosted products. Click refresh to check again.
                      </p>
                      <button
                        onClick={fetchGalleryData}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
                      >
                        Refresh Products
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* Ads Tab */}
        {activeTab === "ads" && (
          <div className="space-y-6">
            {/* Create/Edit Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingAd ? '✏️ Edit Advertisement' : '➕ Create New Advertisement'}
              </h2>
              
              <form onSubmit={handleAdSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ad Position *
                    </label>
                    <select
                      value={adFormData.position}
                      onChange={(e) => setAdFormData({ ...adFormData, position: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={editingAd !== null}
                    >
                      <option value="banner">Main Banner (1200x233px)</option>
                      <option value="left-sidebar">Left Sidebar (160x550px)</option>
                      <option value="right-sidebar">Right Sidebar (160x550px)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ad Title *
                    </label>
                    <input
                      type="text"
                      value={adFormData.title}
                      onChange={(e) => setAdFormData({ ...adFormData, title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Summer Sale 2024"
                      maxLength={100}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {adFormData.title.length}/100 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Link URL (optional)
                    </label>
                    <input
                      type="url"
                      value={adFormData.linkUrl}
                      onChange={(e) => setAdFormData({ ...adFormData, linkUrl: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/promotion"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adFormData.isActive}
                        onChange={(e) => setAdFormData({ ...adFormData, isActive: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded mr-3"
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        Active (show on homepage)
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ad Image * (Max 5MB, JPG/PNG/WebP)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="px-6 py-3 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700">
                      Choose Image
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleAdImageChange}
                        className="hidden"
                      />
                    </label>
                    {adFormData.image && (
                      <span className="text-sm text-gray-600">
                        ✓ {adFormData.image.name} ({(adFormData.image.size / 1024).toFixed(0)} KB)
                      </span>
                    )}
                  </div>

                  {adPreview && (
                    <div className="mt-4 relative inline-block">
                      <img
                        src={adPreview}
                        alt="Preview"
                        className="max-w-full max-h-64 rounded-lg border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAdPreview(null)
                          setAdFormData({ ...adFormData, image: null })
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={adsLoading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {adsLoading ? 'Saving...' : (editingAd ? '💾 Update Ad' : '➕ Create Ad')}
                  </button>
                  
                  {editingAd && (
                    <button
                      type="button"
                      onClick={resetAdForm}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      ✕ Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Ads List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Advertisement Management</h2>
                <input
                  type="text"
                  placeholder="Search ads..."
                  value={adSearchInput}
                  onChange={(e) => setAdSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setAdSearch(adSearchInput)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg"
                />
              </div>

              {adsLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading ads...</p>
                </div>
              ) : filteredAds.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Preview</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Title</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Position</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Clicks</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Impressions</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">CTR</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredAds.map((ad) => {
                        const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00'
                        
                        return (
                          <tr key={ad._id} className="hover:bg-blue-50">
                            <td className="px-6 py-4">
                              <img
                                src={`${import.meta.env.VITE_SERVER}${ad.imageUrl}`}
                                alt={ad.title}
                                className="h-16 w-28 rounded-lg object-cover border border-gray-200"
                              />
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-900">{ad.title}</td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold border-2 border-gray-300 bg-white">
                                {ad.position === 'banner' ? '🎯 Banner' : 
                                 ad.position === 'left-sidebar' ? '⬅️ Left' : '➡️ Right'}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold">{ad.clicks || 0}</td>
                            <td className="px-6 py-4 font-bold">{ad.impressions || 0}</td>
                            <td className="px-6 py-4 font-bold text-blue-600">{ctr}%</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                ad.isActive
                                  ? "bg-green-100 text-green-800 border border-green-300"
                                  : "bg-red-100 text-red-800 border border-red-300"
                              }`}>
                                {ad.isActive ? "✓ Active" : "✕ Disabled"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditAd(ad)}
                                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-semibold"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => toggleAdStatus(ad._id, ad.isActive)}
                                  className={`px-3 py-2 text-white rounded-lg text-xs font-semibold ${
                                    ad.isActive ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"
                                  }`}
                                >
                                  {ad.isActive ? "⏸️ Disable" : "▶️ Enable"}
                                </button>
                                <button
                                  onClick={() => deleteAd(ad._id)}
                                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-semibold"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <div className="text-6xl mb-6">📢</div>
                  <p className="text-lg font-semibold mb-2">
                    {adSearch ? "No ads found matching your search" : "No ads created yet"}
                  </p>
                  <p className="text-sm">
                    {adSearch ? "Try different search terms" : "Create your first ad using the form above"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "queries" && (
          <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="bg-white rounded-2xl shadow-md border border-blue-100 p-2">
              <div className="flex gap-2 overflow-x-auto">
                {[
                  { key: "all", label: "All" },
                  { key: "open", label: "Open" },
                  { key: "in_progress", label: "In Progress" },
                  { key: "resolved", label: "Resolved" },
                  { key: "closed", label: "Closed" }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setQueryStatusFilter(tab.key)}
                    className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                      queryStatusFilter === tab.key
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-blue-50"
                    }`}
                  >
                    {tab.label}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      queryStatusFilter === tab.key 
                        ? "bg-white/20 text-white" 
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {getQueryCount(tab.key)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <input
                type="text"
                placeholder="Search queries by message, issue type, or status..."
                value={querySearchInput}
                onChange={(e) => setQuerySearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setQuerySearch(querySearchInput)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Queries List */}
            {queriesLoading ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading queries...</p>
              </div>
            ) : filteredQueries.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No queries found</h3>
                <p className="text-gray-600">
                  {querySearch ? "Try different search terms" : "No support queries yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQueries.map(query => {
                  const statusConfig = getStatusConfig(query.status)
                  return (
                    <div
                      key={query.concernId || query._id}
                      onClick={() => fetchQueryDetails(query.concernId || query._id)}
                      className="bg-white rounded-2xl shadow-md border border-blue-100 p-6 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 hover:border-blue-300"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                              {formatIssueType(query.issueType)}
                            </span>
                            <span className={`px-3 py-1.5 ${statusConfig.bg} ${statusConfig.color} rounded-full text-xs font-semibold flex items-center gap-1.5 border ${statusConfig.border}`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                            {query.images && query.images.length > 0 && (
                              <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-purple-200">
                                <ImageIcon className="w-3.5 h-3.5" />
                                {query.images.length}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-3 line-clamp-2">{query.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(query.createdAt).toLocaleDateString()}
                            </span>
                            {query.adminResponses?.length > 0 && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <MessageSquare className="w-3.5 h-3.5" />
                                {query.adminResponses.length} Response{query.adminResponses.length > 1 ? "s" : ""}
                              </span>
                            )}
                            {query.userId?.name && (
                              <span className="font-semibold text-gray-700">
                                User: {query.userId.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-end md:justify-start">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Query Details Modal */}
        {showQueryDetails && selectedQuery && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowQueryDetails(false)}
          >
            <div 
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-3xl z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">Query Details</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-white/20 text-white rounded-full text-xs font-semibold border border-white/30">
                        {formatIssueType(selectedQuery.issueType)}
                      </span>
                      <span className={`px-3 py-1.5 bg-white ${getStatusConfig(selectedQuery.status).color} rounded-full text-xs font-semibold flex items-center gap-1.5`}>
                        {getStatusConfig(selectedQuery.status).icon}
                        {getStatusConfig(selectedQuery.status).label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQueryDetails(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* User's Query */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-6 border border-blue-100">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    User's Query
                  </h4>
                  <p className="text-gray-700 leading-relaxed mb-4">{selectedQuery.message}</p>
                  
                  {/* Images */}
                  {selectedQuery.images && selectedQuery.images.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-gray-900">
                          Attachments ({selectedQuery.images.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {selectedQuery.images.map((img, idx) => {
                          const imageUrl = getImageUrl(img)
                          return (
                            <div 
                              key={idx}
                              className="group relative aspect-square rounded-xl overflow-hidden border-2 border-blue-200 shadow-md hover:shadow-xl transition-all cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleImageClick(img)
                              }}
                            >
                              <img
                                src={imageUrl}
                                alt={`Attachment ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="w-8 h-8 text-white" />
                              </div>
                              <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-bold">
                                {idx + 1}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-blue-200 text-xs text-gray-600">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="font-semibold">Created:</span> {new Date(selectedQuery.createdAt).toLocaleString()}</div>
                      <div><span className="font-semibold">Updated:</span> {new Date(selectedQuery.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Admin Responses */}
                {selectedQuery.adminResponses?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      Admin Responses
                    </h4>
                    <div className="space-y-3">
                      {selectedQuery.adminResponses.map((response, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-l-4 border-blue-500">
                          <p className="text-gray-700 leading-relaxed mb-3">{response.message}</p>
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="font-semibold text-blue-700">
                              {response.adminId?.name || "Admin"}
                            </span>
                            <span>{new Date(response.respondedAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedQuery.status !== "closed" && (
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowResponseModal(true)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Add Response
                      </button>
                      <button
                        onClick={() => setShowCloseModal(true)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        Close Query
                      </button>
                    </div>
                    <select
                      onChange={(e) => handleStatusChange(e.target.value)}
                      value=""
                      className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:border-blue-500 transition-all outline-none font-semibold text-gray-700"
                    >
                      <option value="">Change Status</option>
                      <option value="open">🔴 Open</option>
                      <option value="in_progress">🔵 In Progress</option>
                      <option value="resolved">✅ Resolved</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Image Lightbox */}
        {showImageLightbox && selectedImage && (
          <div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4"
            onClick={() => setShowImageLightbox(false)}
          >
            <button
              onClick={() => setShowImageLightbox(false)}
              className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                Add Response
              </h3>
              <p className="text-gray-600 mb-6">Write a response to help the user</p>
              <textarea
                rows={6}
                placeholder="Enter your response..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none resize-none"
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendAdminResponse}
                  disabled={!responseMessage.trim() || sendingResponse}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {sendingResponse ? "Sending..." : "Send Response"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close Modal */}
        {showCloseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-red-600 mb-2 flex items-center gap-2">
                <Lock className="w-6 h-6" />
                Close Query
              </h3>
              <p className="text-gray-600 mb-6">Write a closing message that will be sent to the user via email.</p>
              <textarea
                rows={6}
                placeholder="Example: Your issue has been resolved. Thank you for your patience!"
                value={closeMessage}
                onChange={(e) => setCloseMessage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-red-500 outline-none resize-none"
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCloseModal(false)}
                  disabled={closingQuery}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseQueryWithMessage}
                  disabled={!closeMessage.trim() || closingQuery}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50"
                >
                  {closingQuery ? "Closing..." : "Close & Send Email"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
