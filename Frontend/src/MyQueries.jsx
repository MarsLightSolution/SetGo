import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function MyQueries() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId") || "68b1e2fa927f21500b024dd0";

  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchQueries();
  }, []);

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
        maxWidth: "900px",
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
        <h2 style={{ color: "#0078ff", margin: 0 }}>🎫 My Queries</h2>
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
          }}
        >
          + Raise New Query
        </button>
      </div>

      {/* Queries List */}
      {queries.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            background: "#f9f9f9",
            borderRadius: "12px",
          }}
        >
          <h3>📭 No queries yet</h3>
          <p style={{ color: "#666" }}>
            You haven't raised any queries. If you need help, feel free to raise
            one!
          </p>
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
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {queries.map((query) => (
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
                      {getStatusIcon(query.status)} {query.status.toUpperCase()}
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
            background: "rgba(0,0,0,0.5)",
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
              maxWidth: "700px",
              width: "100%",
              maxHeight: "80vh",
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
                      background:
                        getStatusColor(selectedQuery.status) + "20",
                      color: getStatusColor(selectedQuery.status),
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {getStatusIcon(selectedQuery.status)}{" "}
                    {selectedQuery.status.toUpperCase()}
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
              <h4 style={{ marginTop: 0 }}>Your Query:</h4>
              <p style={{ lineHeight: 1.6, color: "#333" }}>
                {selectedQuery.message}
              </p>

              {/* Additional Info */}
              {selectedQuery.orderId && (
                <div style={{ marginTop: "10px" }}>
                  <strong>Order ID:</strong>{" "}
                  {selectedQuery.orderId._id || selectedQuery.orderId}
                </div>
              )}
              {selectedQuery.transactionId && (
                <div style={{ marginTop: "10px" }}>
                  <strong>Transaction ID:</strong> {selectedQuery.transactionId}
                </div>
              )}
              {selectedQuery.walletId && (
                <div style={{ marginTop: "10px" }}>
                  <strong>Wallet ID:</strong> {selectedQuery.walletId}
                </div>
              )}

              {/* Images */}
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
                {selectedQuery.estimatedResolutionDate && (
                  <div>
                    <strong>Est. Resolution:</strong>{" "}
                    {new Date(
                      selectedQuery.estimatedResolutionDate
                    ).toLocaleString("en-IN")}
                  </div>
                )}
              </div>
            </div>

            {/* Admin Responses */}
            {selectedQuery.adminResponses &&
              selectedQuery.adminResponses.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: "15px" }}>
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
                        }}
                      >
                        <span>
                          <strong>Support Agent:</strong>{" "}
                          {response.adminId?.name || "Admin"}
                        </span>
                        <span>
                          {new Date(response.respondedAt).toLocaleString(
                            "en-IN"
                          )}
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
                }}
              >
                <p style={{ margin: 0, color: "#f57c00" }}>
                  ⏳ Our team is reviewing your query. You'll receive a response
                  within 24-48 hours.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}