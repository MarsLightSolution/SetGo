import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, ShoppingBag, ArrowLeft, Loader2, Package, CreditCard, RotateCcw, Wallet, AlertCircle, Headphones } from "lucide-react";

export default function Chatbot({ onClose }) {
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

  const userId = typeof window !== 'undefined' ? (window.localStorage?.getItem("userId") || null) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const MENU_ICONS = {
    "Where is my order?": <Package className="w-4 h-4" />,
    "Payment issues": <CreditCard className="w-4 h-4" />,
    "Return or refund policy": <RotateCcw className="w-4 h-4" />,
    "Wallet & Escrow help": <Wallet className="w-4 h-4" />,
    "Report an ad or seller": <AlertCircle className="w-4 h-4" />,
    "Contact customer support": <Headphones className="w-4 h-4" />,
    "Show all my orders": <Package className="w-4 h-4" />,
    "Track a specific order": <Package className="w-4 h-4" />,
    "Cancel an order": <Package className="w-4 h-4" />,
    "Payment failed": <CreditCard className="w-4 h-4" />,
    "Refund not received": <CreditCard className="w-4 h-4" />,
    "Add funds to wallet": <Wallet className="w-4 h-4" />,
    "Back": <ArrowLeft className="w-4 h-4" />,
  };

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
    setMessages((prev) => [...prev, { sender: "user", text: question }]);

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

    if (question === "Track a specific order") {
      setShowOrderInput(true);
      setMessages((prev) => [...prev, { 
        sender: "bot", 
        text: "Please enter your Order ID below:" 
      }]);
      return;
    }

    await fetchResponse(question);
  };

  const handleOrderSubmit = async (e) => {
    if (e) e.preventDefault();
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
      const { data } = await axios.post(`${import.meta.env.VITE_SERVER}/chatbot/ask`, {
        question,
        orderId: orderIdParam,
        userId
      });

      if (data.success) {
        setMessages((prev) => [...prev, { 
          sender: "bot", 
          text: data.answer 
        }]);

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
      // Error handled - show user-friendly message
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Sorry, something went wrong. Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseQuery = () => {
    navigate("/raise-query");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleOrderSubmit();
    }
  };

  return (
   <div className="relative w-full sm:w-[95%] md:w-[90%] lg:w-[85%] xl:w-[80%] mx-auto h-[calc(100vh-120px)] min-h-[500px] max-h-[800px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300">

 
       

     
      
      
     {/* Header with green gradient */}
<div className="relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-4 sm:p-6 text-white overflow-hidden">
  {/* Decorative background circles */}
  <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-16 -mb-16"></div>
  <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white opacity-5 rounded-full"></div>

 {onClose && (
  <button
    onClick={onClose}
    className="absolute top-3 right-3 bg-white text-gray-700 hover:bg-gray-100 rounded-full p-2 shadow-md transition-all duration-200 hover:scale-105 z-20 cursor-pointer"
    aria-label="Close Chatbot"
  >
    ✕
  </button>
)}



  {/* Header Content */}
  <div className="relative flex items-center gap-3 justify-start">
  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
  </div>
  <div>
    <h1 className="text-lg sm:text-xl font-bold text-white">Your Shop Assistant</h1>
    <p className="text-emerald-50 text-xs sm:text-sm flex items-center gap-1.5">
      <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse shadow-lg shadow-green-300/50"></div>
      Online • Ready to help
    </p>
  </div>
</div>

</div>


      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-emerald-50/30 to-white p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx}>
            <div className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}>
              <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-md ${
                msg.sender === "user" 
                  ? "bg-gradient-to-br from-emerald-600 to-green-600 text-white rounded-tr-sm" 
                  : "bg-white text-gray-800 rounded-tl-sm border border-emerald-100"
              }`}>
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>

            {msg.action === "raiseQuery" && (
              <div className="flex justify-start mt-3 animate-fadeIn">
                <button
  onClick={handleRaiseQuery}
  className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
>
 

                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Raise a Query
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-white text-gray-600 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-md border border-emerald-100 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-emerald-600" />
              <span className="text-xs sm:text-sm">Typing...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Footer - Input or Menu */}
      <div className="border-t border-emerald-100 bg-gradient-to-b from-white to-emerald-50/20 p-3 sm:p-4">
        {showOrderInput ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowOrderInput(false)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-emerald-100 hover:bg-emerald-200 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
            </button>
            <input
              type="text"
              placeholder="Enter Order ID (e.g., ORD12345)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs sm:text-sm transition-all"
              autoFocus
            />
            <button
              type="button"
              onClick={handleOrderSubmit}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex-shrink-0"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {(MENUS[currentMenu] || []).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuestion(q)}
                className={`p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 justify-center ${
                  q === "Back"
                    ? "col-span-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 shadow-sm"
                    : "bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 hover:shadow-md"
                }`}
              >
                {MENU_ICONS[q]}
                <span className="leading-tight">{q}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #a7f3d0;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #6ee7b7;
        }
      `}</style>
    </div>
  );
}