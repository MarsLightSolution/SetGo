import React, { useState, useEffect } from "react";
import axios from "axios";
import { closeConcernWithMessage, addAdminResponse, updateConcernStatus } from "./queryApi";
import { 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle, 
  MessageSquare, 
  Send,
  X,
  Calendar,
  Lock,
  Edit3,
  Image as ImageIcon,
  Loader,
  ZoomIn
} from "lucide-react";

// ✅ Backend Base URL - Change this to your actual backend URL
const BACKEND_URL = "http://localhost:8080";

// ✅ Helper function to get full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If already a full URL, return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  
  return `${BACKEND_URL}/${cleanPath}`;
};

export default function MyQueries() {
  // Get userId and adminId from localStorage
  const userId = typeof window !== 'undefined' ? localStorage.getItem("userId") || "68b1e2fa927f21500b024dd0" : "68b1e2fa927f21500b024dd0";
  const adminId = typeof window !== 'undefined' ? localStorage.getItem("adminId") || "60d5ec49f1b2c72b8c8e4f20" : "60d5ec49f1b2c72b8c8e4f20";

  const [queries, setQueries] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Image Lightbox States
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  
  // Close Query Modal States
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeMessage, setCloseMessage] = useState("");
  const [closingQuery, setClosingQuery] = useState(false);

  // Admin Response Modal States
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/concern/user?userId=${userId}`
      );

      if (data.success) {
        setQueries(data.concerns);
      }
    } catch (error) {
      console.error("Error fetching queries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueryDetails = async (concernId) => {
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/concern/${concernId}?userId=${userId}`
      );

      if (data.success) {
        setSelectedQuery(data.data);
        setShowDetails(true);
      }
    } catch (error) {
      console.error("Error fetching query details:", error);
    }
  };

  const handleOpenCloseModal = () => {
    setShowCloseModal(true);
    setCloseMessage("");
  };

  const handleCloseQueryWithMessage = async () => {
    if (!closeMessage.trim()) {
      alert("Please enter a closing message for the user.");
      return;
    }

    setClosingQuery(true);
    try {
      const result = await closeConcernWithMessage(
        selectedQuery._id,
        adminId,
        closeMessage
      );

      if (result.success) {
        alert("✅ Query closed successfully! Email sent to user.");
        setShowCloseModal(false);
        setCloseMessage("");
        setShowDetails(false);
        fetchQueries();
      }
    } catch (err) {
      console.error("Error closing query:", err);
      alert("❌ Failed to close query. Please try again.");
    } finally {
      setClosingQuery(false);
    }
  };

  const handleOpenResponseModal = () => {
    setShowResponseModal(true);
    setResponseMessage("");
  };

  const handleSendAdminResponse = async () => {
    if (!responseMessage.trim()) {
      alert("Please enter a response message.");
      return;
    }

    setSendingResponse(true);
    try {
      const result = await addAdminResponse(
        selectedQuery._id,
        adminId,
        responseMessage
      );

      if (result.success) {
        alert("✅ Response sent successfully!");
        setShowResponseModal(false);
        setResponseMessage("");
        fetchQueryDetails(selectedQuery._id);
        fetchQueries();
      }
    } catch (err) {
      console.error("Error sending response:", err);
      alert("❌ Failed to send response. Please try again.");
    } finally {
      setSendingResponse(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedQuery || !newStatus) return;

    try {
      const result = await updateConcernStatus(selectedQuery._id, newStatus);
      if (result.success) {
        alert(`✅ Status updated to ${newStatus}`);
        fetchQueryDetails(selectedQuery._id);
        fetchQueries();
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("❌ Failed to update status.");
    }
  };

  // Image handling functions
  const handleImageClick = (imagePath) => {
    const fullUrl = getImageUrl(imagePath);
    setSelectedImage(fullUrl);
    setShowImageLightbox(true);
  };

  const handleCloseLightbox = () => {
    setShowImageLightbox(false);
    setSelectedImage(null);
  };

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
    };
    return configs[status] || configs.open;
  };

  const formatIssueType = (type) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const filteredQueries = activeTab === "all" 
    ? queries 
    : queries.filter(q => q.status === activeTab);

  const getQueryCount = (status) => {
    return status === "all" ? queries.length : queries.filter(q => q.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">Loading your queries...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-8 px-4 flex justify-center">
      <div className="bg-white rounded-3xl shadow-lg w-full max-w-4xl p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Support Queries</h1>
                <p className="text-sm text-gray-600 mt-1">Track and manage your support tickets</p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = "/raise-query"}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Raise New Query
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md border border-emerald-100 p-2 mb-6">
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
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-emerald-50"
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.key 
                    ? "bg-white/20 text-white" 
                    : "bg-emerald-100 text-emerald-700"
                }`}>
                  {getQueryCount(tab.key)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Queries List */}
        {filteredQueries.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 p-12 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No queries found</h3>
            <p className="text-gray-600 mb-6">
              {activeTab === "all" 
                ? "You haven't raised any queries yet." 
                : `No ${activeTab.replace("_", " ")} queries.`}
            </p>
            <button 
              onClick={() => window.location.href = "/raise-query"}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg"
            >
              Raise Your First Query
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQueries.map(query => {
              const statusConfig = getStatusConfig(query.status);
              return (
                <div
                  key={query.concernId}
                  onClick={() => fetchQueryDetails(query.concernId)}
                  className="bg-white rounded-2xl shadow-md border border-emerald-100 p-6 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                          {formatIssueType(query.issueType)}
                        </span>
                        <span className={`px-3 py-1.5 ${statusConfig.bg} ${statusConfig.color} rounded-full text-xs font-semibold flex items-center gap-1.5 border ${statusConfig.border}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                        {query.images && query.images.length > 0 && (
                          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-blue-200">
                            <ImageIcon className="w-3.5 h-3.5" />
                            {query.images.length} Image{query.images.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-3 line-clamp-2">{query.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(query.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                        {query.adminResponses?.length > 0 && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {query.adminResponses.length} Response{query.adminResponses.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end md:justify-start">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Query Details Modal */}
        {showDetails && selectedQuery && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetails(false)}
          >
            <div 
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-green-600 p-6 rounded-t-3xl z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">Query Details</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-semibold border border-white/30">
                        {formatIssueType(selectedQuery.issueType)}
                      </span>
                      <span className={`px-3 py-1.5 bg-white ${getStatusConfig(selectedQuery.status).color} rounded-full text-xs font-semibold flex items-center gap-1.5`}>
                        {getStatusConfig(selectedQuery.status).icon}
                        {getStatusConfig(selectedQuery.status).label}
                      </span>
                      {selectedQuery.images && selectedQuery.images.length > 0 && (
                        <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-semibold border border-white/30 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5" />
                          {selectedQuery.images.length} Attachment{selectedQuery.images.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* User's Query */}
                <div className="bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-2xl p-6 border border-emerald-100">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                    User's Query
                  </h4>
                  <p className="text-gray-700 leading-relaxed mb-4">{selectedQuery.message}</p>
                  
                  <div className="space-y-2 text-sm">
                    {selectedQuery.orderId && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">Order ID:</span>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-mono text-xs">
                          {selectedQuery.orderId._id || selectedQuery.orderId}
                        </span>
                      </div>
                    )}
                    {selectedQuery.transactionId && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">Transaction ID:</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-mono text-xs">
                          {selectedQuery.transactionId}
                        </span>
                      </div>
                    )}
                    {selectedQuery.walletId && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">Wallet ID:</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg font-mono text-xs">
                          {selectedQuery.walletId}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ✅ FIXED: Enhanced Image Display Section with proper URL handling */}
                  {selectedQuery.images && selectedQuery.images.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <ImageIcon className="w-5 h-5 text-emerald-600" />
                        <span className="font-bold text-gray-900">
                          Attached Images ({selectedQuery.images.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {selectedQuery.images.map((img, idx) => {
                          const imageUrl = getImageUrl(img);
                          return (
                            <div 
                              key={idx}
                              className="group relative aspect-square rounded-xl overflow-hidden border-2 border-emerald-200 shadow-md hover:shadow-xl transition-all cursor-pointer bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageClick(img);
                              }}
                            >
                              <img
                                src={imageUrl}
                                alt={`Query attachment ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  console.error(`Failed to load image: ${imageUrl}`);
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+';
                                }}
                              />
                              {/* Overlay on Hover */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="flex gap-2">
                                  <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                                    <ZoomIn className="w-5 h-5 text-emerald-600" />
                                  </div>
                                </div>
                              </div>
                              {/* Image Number Badge */}
                              <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                                {idx + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-emerald-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600">
                    <div>
                      <span className="font-semibold">Created:</span> {new Date(selectedQuery.createdAt).toLocaleString("en-IN")}
                    </div>
                    <div>
                      <span className="font-semibold">Updated:</span> {new Date(selectedQuery.updatedAt).toLocaleString("en-IN")}
                    </div>
                    {selectedQuery.closedAt && (
                      <div className="col-span-2">
                        <span className="font-semibold">Closed:</span> {new Date(selectedQuery.closedAt).toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Responses */}
                {selectedQuery.adminResponses?.length > 0 ? (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-emerald-600" />
                      Support Team Responses
                    </h4>
                    <div className="space-y-3">
                      {selectedQuery.adminResponses.map((response, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border-l-4 border-emerald-500">
                          <p className="text-gray-700 leading-relaxed mb-3">{response.message}</p>
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="font-semibold text-emerald-700">
                              {response.adminId?.name || "Support Team"}
                            </span>
                            <span>{new Date(response.respondedAt).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200 text-center">
                    <Clock className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                    <p className="text-orange-700 font-medium">
                      Our team is reviewing your query. You'll receive a response within 24-48 hours.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedQuery.status !== "closed" ? (
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleOpenResponseModal}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Add Response
                      </button>
                      <button
                        onClick={handleOpenCloseModal}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        Close Query
                      </button>
                    </div>
                    {selectedQuery.status !== "resolved" && (
                      <select
                        onChange={(e) => handleStatusChange(e.target.value)}
                        value=""
                        className="w-full px-4 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none font-semibold text-gray-700 cursor-pointer"
                      >
                        <option value="">Change Status</option>
                        <option value="open">🔴 Open</option>
                        <option value="in_progress">🔵 In Progress</option>
                        <option value="resolved">✅ Resolved</option>
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-2xl p-4 text-center">
                    <CheckCircle className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">This query has been closed</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ✅ Image Lightbox Modal - Download removed */}
        {showImageLightbox && selectedImage && (
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
            onClick={handleCloseLightbox}
          >
            <div className="relative max-w-6xl w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <button
                onClick={handleCloseLightbox}
                className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all z-10 group"
              >
                <X className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </button>

              {/* Enlarged Image */}
              <div 
                className="relative max-h-[90vh] max-w-[90vw]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedImage}
                  alt="Enlarged view"
                  className="max-h-[90vh] max-w-full w-auto h-auto object-contain rounded-2xl shadow-2xl"
                  onError={(e) => {
                    console.error(`Failed to load enlarged image: ${selectedImage}`);
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+';
                  }}
                />
              </div>

              {/* Hint Text */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full">
                <p className="text-white text-sm font-medium">Click outside to close</p>
              </div>
            </div>
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-emerald-600" />
                Add Response
              </h3>
              <p className="text-gray-600 mb-6">Write a response to help the user with their query</p>
              <textarea
                rows={6}
                placeholder="Enter your response here..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none resize-none"
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowResponseModal(false)}
                  disabled={sendingResponse}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendAdminResponse}
                  disabled={!responseMessage.trim() || sendingResponse}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingResponse ? "Sending..." : "Send Response"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close Modal */}
        {showCloseModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-red-600 mb-2 flex items-center gap-2">
                <Lock className="w-6 h-6" />
                Close Query
              </h3>
              <p className="text-gray-600 mb-6">Write a closing message. This will be sent to the user via email.</p>
              <textarea
                rows={6}
                placeholder="Example: Your issue has been resolved. Thank you for your patience!"
                value={closeMessage}
                onChange={(e) => setCloseMessage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all outline-none resize-none"
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCloseModal(false)}
                  disabled={closingQuery}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseQueryWithMessage}
                  disabled={!closeMessage.trim() || closingQuery}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {closingQuery ? "Closing..." : "Close & Send Email"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}