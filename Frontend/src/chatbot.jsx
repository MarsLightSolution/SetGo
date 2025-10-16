import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Add this import

export default function Chatbot() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState([
    { sender: "bot", text: "👋 Hi! I'm your shopping assistant. How can I help you today?" },
  ]);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [showOrderInput, setShowOrderInput] = useState(false);
  const [menuStack, setMenuStack] = useState([]);
  const [currentMenu, setCurrentMenu] = useState("main");

  // Get userId from localStorage (assuming user is logged in)
  const userId = localStorage.getItem("userId") ;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const MENUS = {
    main: [
      "Where is my order?",
      "Payment issues",
      "Return or refund policy",
      "Wallet & Escrow help",
      "Report an ad or seller",
      "Contact customer support",
    ],
    order: [
      "Show all my orders",
      "Track a specific order",
      "Cancel an order",
      "Back",
    ],
    payment: [
      "Payment failed",
      "Refund not received",
      "Add funds to wallet",
      "Back",
    ],
  };

  const handleQuestion = async (question) => {
    // Add user message to chat
    setMessages((prev) => [...prev, { sender: "user", text: question }]);

    // Handle menu navigation
    if (question === "Where is my order?") {
      setMenuStack((prev) => [...prev, currentMenu]);
      setCurrentMenu("order");
      setMessages((prev) => [...prev, { 
        sender: "bot", 
        text: "📦 How can I help with your orders?" 
      }]);
      return;
    }

    if (question === "Payment issues") {
      setMenuStack((prev) => [...prev, currentMenu]);
      setCurrentMenu("payment");
      setMessages((prev) => [...prev, { 
        sender: "bot", 
        text: "💳 What payment issue are you facing?" 
      }]);
      return;
    }

    if (question === "Back") {
      const prevMenu = menuStack.pop();
      setMenuStack([...menuStack]);
      setCurrentMenu(prevMenu || "main");
      setMessages((prev) => [...prev, { 
        sender: "bot", 
        text: "How else can I assist you?" 
      }]);
      return;
    }

    // Handle order input request
    if (question === "Track a specific order") {
      setShowOrderInput(true);
      setMessages((prev) => [...prev, { 
        sender: "bot", 
        text: "Please enter your Order ID below:" 
      }]);
      return;
    }

    // Call backend API for response
    await fetchResponse(question);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: `Order ID: ${orderId}` },
    ]);
    setShowOrderInput(false);

    await fetchResponse("Track a specific order", orderId);
    setOrderId("");
  };

  const fetchResponse = async (question, orderIdParam = null) => {
    setLoading(true);
    try {
      const { data } = await axios.post("http://localhost:8080/chatbot/ask", {
        question,
        orderId: orderIdParam,
        userId
      });

      if (data.success) {
        setMessages((prev) => [...prev, { 
          sender: "bot", 
          text: data.answer 
        }]);

        // Handle redirect to raise query page
        if (data.redirectTo === "raiseQuery") {
          setTimeout(() => {
            setMessages((prev) => [...prev, { 
              sender: "bot", 
              text: "👉 Click the button below to raise a query:",
              action: "raiseQuery"
            }]);
          }, 1000);
        }
      }
    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Sorry, something went wrong. Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseQuery = () => {
    navigate("/raise-query"); // Navigate to raise query page
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "500px",
        height: "600px",
        margin: "20px auto",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "Poppins, sans-serif",
        background: "#fff",
        boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#0078ff",
          color: "#fff",
          padding: "14px 16px",
          fontWeight: "600",
          fontSize: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        🛍️ YourShop Chat Assistant
      </div>

      {/* Chat Messages */}
      <div
        style={{
          flex: 1,
          padding: "14px",
          overflowY: "auto",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx}>
            <div
              style={{
                display: "flex",
                justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                margin: "8px 0",
              }}
            >
              <div
                style={{
                  background: msg.sender === "user" ? "#0078ff" : "#e6e6e6",
                  color: msg.sender === "user" ? "#fff" : "#000",
                  padding: "10px 14px",
                  borderRadius: 14,
                  maxWidth: "80%",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  fontSize: 14,
                }}
              >
                {msg.text}
              </div>
            </div>

            {/* Raise Query Button */}
            {msg.action === "raiseQuery" && (
              <div style={{ display: "flex", justifyContent: "flex-start", margin: "8px 0" }}>
                <button
                  onClick={handleRaiseQuery}
                  style={{
                    background: "#ff4444",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                    boxShadow: "0 4px 12px rgba(255,68,68,0.3)",
                  }}
                >
                  🎫 Raise a Query
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ color: "#555", fontStyle: "italic", marginTop: 4 }}>
            <span className="typing-indicator">●●●</span> Typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Footer - Input or Menu */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid #eee",
          background: "#fff",
        }}
      >
        {showOrderInput ? (
          <form
            onSubmit={handleOrderSubmit}
            style={{ display: "flex", gap: "8px", alignItems: "center" }}
          >
            <input
              type="text"
              placeholder="Enter your Order ID..."
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: 14,
                outline: "none",
              }}
              autoFocus
            />
            <button
              type="submit"
              style={{
                background: "#0078ff",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Send
            </button>
          </form>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            {(MENUS[currentMenu] || []).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuestion(q)}
                style={{
                  background: "#f0f4ff",
                  border: "1px solid #0078ff",
                  borderRadius: 12,
                  padding: "8px 12px",
                  cursor: "pointer",
                  flex: "1 1 45%",
                  fontSize: 13,
                  color: "#0078ff",
                  fontWeight: 500,
                  transition: "0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#e5edff")}
                onMouseLeave={(e) => (e.target.style.background = "#f0f4ff")}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}