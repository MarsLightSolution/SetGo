import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { closeConcernWithMessage, addAdminResponse, updateConcernStatus } from "./queryApi";

export default function MyQueries() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId") || "68b1e2fa927f21500b024dd0";
  const adminId = localStorage.getItem("adminId") || "60d5ec49f1b2c72b8c8e4f20"; // Store admin ID

  const [queries, setQueries] = useState([]);
  const [filteredQueries, setFilteredQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
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

  useEffect(() => {
    filterQueriesByTab();
  }, [queries, activeTab]);

  const fetchQueries = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:8080/concern/user?userId=${userId}`
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
        `http://localhost:8080/concern/${concernId}?userId=${userId}`
      );

      if (data.success) {
        setSelectedQuery(data.data);
        setShowDetails(true);
      }
    } catch (error) {
      console.error("Error fetching query details:", error);
    }
  };

  const filterQueriesByTab = () => {
    if (activeTab === "all") {
      setFilteredQueries(queries);
    } else {
      setFilteredQueries(queries.filter((q) => q.status === activeTab));
    }
  };

  const getQueryCountByStatus = (status) => {
    if (status === "all") return queries.length;
    return queries.filter((q) => q.status === status).length;
  };

  // Handle Close Query with Message
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
        fetchQueries(); // Refresh the list
      }
    } catch (err) {
      console.error("Error closing query:", err);
      alert("❌ Failed to close query. Please try again.");
    } finally {
      setClosingQuery(false);
    }
  };

  // Handle Admin Response (without closing)
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
        fetchQueryDetails(selectedQuery._id); // Refresh details
        fetchQueries(); // Refresh list
      }
    } catch (err) {
      console.error("Error sending response:", err);
      alert("❌ Failed to send response. Please try again.");
    } finally {
      setSendingResponse(false);
    }
  };

  // Handle Status Change
  const handleStatusChange = async (newStatus) => {
    if (!selectedQuery) return;

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

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "#ff9800";
      case "in_progress":
        return "#2196f3";
      case "resolved":
        return "#4caf50";
      case "closed":
        return "#9e9e9e";
      default:
        return "#666";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return "🔴";
      case "in_progress":
        return "🔵";
      case "resolved":
        return "✅";
      case "closed":
        return "⚫";
      default:
        return "❓";
    }
  };

  const formatIssueType = (type) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h3>Loading your queries...</h3>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ color: "#0078ff", margin: 0 }}>🎫 Support Queries</h2>
        <button
          onClick={() => navigate("/raise-query")}
          style={{
            padding: "10px 20px",
            background: "#0078ff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          + Raise New Query
        </button>
      </div>

      {/* Tabs for Status Filter */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "25px",
          borderBottom: "2px solid #eee",
          paddingBottom: "10px",
          flexWrap: "wrap",
        }}
      >
        {[
          { key: "all", label: "All Queries" },
          { key: "open", label: "Open" },
          { key: "in_progress", label: "In Progress" },
          { key: "resolved", label: "Resolved" },
          { key: "closed", label: "Closed" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 20px",
              background: activeTab === tab.key ? "#0078ff" : "#f5f5f5",
              color: activeTab === tab.key ? "white" : "#666",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: activeTab === tab.key ? 600 : 400,
              fontSize: "14px",
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {tab.label}
            <span
              style={{
                background: activeTab === tab.key ? "rgba(255,255,255,0.3)" : "#ddd",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {getQueryCountByStatus(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Queries List */}
      {filteredQueries.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            background: "#f9f9f9",
            borderRadius: "12px",
          }}
        >
          <h3>📭 No {activeTab !== "all" ? activeTab : ""} queries found</h3>
          <p style={{ color: "#666" }}>
            {activeTab === "all"
              ? "You haven't raised any queries yet."
              : `No queries with status "${activeTab}".`}
          </p>
          {activeTab === "all" && (
            <button
              onClick={() => navigate("/raise-query")}
              style={{
                marginTop: "20px",
                padding: "12px 24px",
                background: "#0078ff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Raise Your First Query
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {filteredQueries.map((query) => (
            <div
              key={query.concernId}
              onClick={() => fetchQueryDetails(query.concernId)}
              style={{
                background: "#fff",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                border: "1px solid #eee",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        padding: "4px 12px",
                        background: "#e3f2fd",
                        color: "#1976d2",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {formatIssueType(query.issueType)}
                    </span>
                    <span
                      style={{
                        padding: "4px 12px",
                        background: getStatusColor(query.status) + "20",
                        color: getStatusColor(query.status),
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {getStatusIcon(query.status)} {query.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "10px 0",
                      fontSize: "15px",
                      color: "#333",
                      lineHeight: 1.5,
                    }}
                  >
                    {query.message}
                  </p>
                  <div style={{ fontSize: "13px", color: "#999" }}>
                    Created:{" "}
                    {new Date(query.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div style={{ marginLeft: "10px", fontSize: "24px" }}>➡️</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Query Details Modal */}
      {showDetails && selectedQuery && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowDetails(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "30px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: "20px",
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 10px 0", color: "#0078ff" }}>
                  Query Details
                </h3>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      padding: "4px 12px",
                      background: "#e3f2fd",
                      color: "#1976d2",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {formatIssueType(selectedQuery.issueType)}
                  </span>
                  <span
                    style={{
                      padding: "4px 12px",
                      background: getStatusColor(selectedQuery.status) + "20",
                      color: getStatusColor(selectedQuery.status),
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {getStatusIcon(selectedQuery.status)}{" "}
                    {selectedQuery.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                ✕
              </button>
            </div>

            {/* Query Info */}
            <div
              style={{
                background: "#f9f9f9",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            >
              <h4 style={{ marginTop: 0, color: "#333" }}>📝 User's Query:</h4>
              <p style={{ lineHeight: 1.6, color: "#333", margin: "10px 0" }}>
                {selectedQuery.message}
              </p>

              {selectedQuery.orderId && (
                <div style={{ marginTop: "10px", fontSize: "14px" }}>
                  <strong>Order ID:</strong>{" "}
                  {selectedQuery.orderId._id || selectedQuery.orderId}
                </div>
              )}
              {selectedQuery.transactionId && (
                <div style={{ marginTop: "10px", fontSize: "14px" }}>
                  <strong>Transaction ID:</strong> {selectedQuery.transactionId}
                </div>
              )}
              {selectedQuery.walletId && (
                <div style={{ marginTop: "10px", fontSize: "14px" }}>
                  <strong>Wallet ID:</strong> {selectedQuery.walletId}
                </div>
              )}

              {selectedQuery.images && selectedQuery.images.length > 0 && (
                <div style={{ marginTop: "15px" }}>
                  <strong>Attached Images:</strong>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    {selectedQuery.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`evidence-${idx}`}
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #ddd",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: "15px",
                  fontSize: "13px",
                  color: "#666",
                }}
              >
                <div>
                  <strong>Created:</strong>{" "}
                  {new Date(selectedQuery.createdAt).toLocaleString("en-IN")}
                </div>
                <div>
                  <strong>Last Updated:</strong>{" "}
                  {new Date(selectedQuery.updatedAt).toLocaleString("en-IN")}
                </div>
                {selectedQuery.closedAt && (
                  <div>
                    <strong>Closed At:</strong>{" "}
                    {new Date(selectedQuery.closedAt).toLocaleString("en-IN")}
                  </div>
                )}
              </div>
            </div>

            {/* Admin Responses */}
            {selectedQuery.adminResponses &&
              selectedQuery.adminResponses.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ marginBottom: "15px", color: "#333" }}>
                    💬 Support Team Responses:
                  </h4>
                  {selectedQuery.adminResponses.map((response, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#e8f5e9",
                        padding: "15px",
                        borderRadius: "12px",
                        marginBottom: "10px",
                        borderLeft: "4px solid #4caf50",
                      }}
                    >
                      <p style={{ margin: "0 0 10px 0", lineHeight: 1.6 }}>
                        {response.message}
                      </p>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          display: "flex",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        <span>
                          <strong>Support Agent:</strong>{" "}
                          {response.adminId?.name || "Admin"}
                        </span>
                        <span>
                          {new Date(response.respondedAt).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {/* No Response Yet */}
            {(!selectedQuery.adminResponses ||
              selectedQuery.adminResponses.length === 0) && (
              <div
                style={{
                  background: "#fff3e0",
                  padding: "20px",
                  borderRadius: "12px",
                  textAlign: "center",
                  border: "1px solid #ffb74d",
                  marginBottom: "20px",
                }}
              >
                <p style={{ margin: 0, color: "#f57c00" }}>
                  ⏳ Our team is reviewing your query. You'll receive a response
                  within 24-48 hours.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {selectedQuery.status !== "closed" && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  paddingTop: "20px",
                  borderTop: "2px solid #eee",
                }}
              >
                {/* Add Response Button */}
                <button
                  onClick={handleOpenResponseModal}
                  style={{
                    padding: "12px 20px",
                    background: "#0078ff",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    flex: 1,
                    minWidth: "150px",
                  }}
                >
                  💬 Add Response
                </button>

                {/* Update Status Dropdown */}
                {selectedQuery.status !== "resolved" && (
                  <select
                    onChange={(e) => handleStatusChange(e.target.value)}
                    value={selectedQuery.status}
                    style={{
                      padding: "12px 16px",
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                      flex: 1,
                      minWidth: "150px",
                    }}
                  >
                    <option value="">Change Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                )}

                {/* Close Query Button */}
                <button
                  onClick={handleOpenCloseModal}
                  style={{
                    padding: "12px 20px",
                    background: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    flex: 1,
                    minWidth: "150px",
                  }}
                >
                  🔒 Close Query
                </button>
              </div>
            )}

            {/* Already Closed Message */}
            {selectedQuery.status === "closed" && (
              <div
                style={{
                  background: "#f5f5f5",
                  padding: "15px",
                  borderRadius: "8px",
                  textAlign: "center",
                  color: "#666",
                  marginTop: "20px",
                }}
              >
                ✅ This query has been closed.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close Query Modal */}
      {showCloseModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "20px",
          }}
          onClick={() => setShowCloseModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              padding: "30px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 20px 0", color: "#f44336" }}>
              🔒 Close Query
            </h3>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              Write a closing message that will be sent to the user via email.
              This action will close the query permanently.
            </p>
            <textarea
              rows="6"
              placeholder="Example: Your issue has been resolved. The replacement product has been dispatched with tracking ID: TRK123456. Thank you for your patience!"
              style={{
                width: "100%",
                border: "2px solid #ddd",
                padding: "15px",
                borderRadius: "8px",
                resize: "vertical",
                fontSize: "14px",
                fontFamily: "inherit",
                minHeight: "120px",
              }}
              value={closeMessage}
              onChange={(e) => setCloseMessage(e.target.value)}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowCloseModal(false)}
                disabled={closingQuery}
                style={{
                  padding: "10px 24px",
                  background: "#f5f5f5",
                  color: "#666",
                  border: "none",
                  borderRadius: "8px",
                  cursor: closingQuery ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCloseQueryWithMessage}
                disabled={closingQuery || !closeMessage.trim()}
                style={{
                  padding: "10px 24px",
                  background:
                    closingQuery || !closeMessage.trim() ? "#ccc" : "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor:
                    closingQuery || !closeMessage.trim()
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                {closingQuery ? "Closing..." : "Close & Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Response Modal */}
      {showResponseModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "20px",
          }}
          onClick={() => setShowResponseModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              padding: "30px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 20px 0", color: "#0078ff" }}>
              💬 Add Admin Response
            </h3>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              Write a response to the user. This will be visible in the query
              details and an email notification will be sent.
            </p>
            <textarea
              rows="5"
              placeholder="Example: We have reviewed your case and initiated the replacement process. You will receive your new product within 3-5 business days."
              style={{
                width: "100%",
                border: "2px solid #ddd",
                padding: "15px",
                borderRadius: "8px",
                resize: "vertical",
                fontSize: "14px",
                fontFamily: "inherit",
                minHeight: "100px",
              }}
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowResponseModal(false)}
                disabled={sendingResponse}
                style={{
                  padding: "10px 24px",
                  background: "#f5f5f5",
                  color: "#666",
                  border: "none",
                  borderRadius: "8px",
                  cursor: sendingResponse ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendAdminResponse}
                disabled={sendingResponse || !responseMessage.trim()}
                style={{
                  padding: "10px 24px",
                  background:
                    sendingResponse || !responseMessage.trim()
                      ? "#ccc"
                      : "#0078ff",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor:
                    sendingResponse || !responseMessage.trim()
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                {sendingResponse ? "Sending..." : "Send Response"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}