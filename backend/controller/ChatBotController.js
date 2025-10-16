// controllers/chatbotController.js
const axios = require("axios");

const BASE_URL = "http://localhost:8080";

// ========================= LOGGER HELPERS =========================
const logInfo = (endpoint, message, extra = {}) => {
  console.log(`[${new Date().toISOString()}] ✅ INFO in ${endpoint} | ${message}`, extra);
};

const logError = (endpoint, err, extra = {}) => {
  console.error(`[${new Date().toISOString()}] ❌ ERROR in ${endpoint} | ${err.message}`, {
    stack: err.stack,
    ...extra,
  });
};

// ========================= MAIN HANDLER =========================
exports.getChatResponse = async (req, res) => {
  const endpoint = "getChatResponse";
  const { question, orderId, userId } = req.body;

  let answer = "I'm sorry, I didn't understand that question.";
  let showMenu = true;
  let redirectTo = null;

  try {
    if (!question) {
      logError(endpoint, new Error("Missing question field"), { body: req.body });
      return res.status(400).json({
        success: false,
        answer: "⚠️ Please provide a message or question.",
        showMenu: true,
      });
    }

    logInfo(endpoint, `Question received: ${question}`, { orderId, userId });

    switch (question) {
      // ==================== ORDER TRACKING ====================
      case "Where is my order?":
      case "Track a specific order":
        if (!orderId) {
          logInfo(endpoint, "Order ID missing for order tracking");
          return res.json({
            success: false,
            answer: "Please provide your Order ID so I can check its status.",
            showMenu: false,
            requireInput: "orderId",
          });
        }

        try {
          const { data } = await axios.get(`${BASE_URL}/Orders/${orderId}`);

          if (!data.success || !data.data) throw new Error("Invalid order response from API");

          const order = data.data;
          const productName = order.productId?.title?.en || "your product";
          const orderStatus = order.status || "processing";
          const trackingId = order.trackingId || "not available";
          const city = order.checkoutDetails?.city || "-";

          answer = `✅ **Order Status for ${productName}**:\n\n• Status: **${orderStatus.toUpperCase()}**\n• Tracking ID: ${trackingId}\n• Delivery City: ${city}\n\nYou'll be notified once shipped! 🚚`;
          logInfo(endpoint, `Fetched order successfully`, { orderId, orderStatus });
        } catch (error) {
          logError(endpoint, error, { orderId });
          answer = "❌ Sorry, I couldn't fetch your order details. Please verify your Order ID or try again later.";
        }
        break;

      // ==================== SHOW ALL ORDERS ====================
      case "Show all my orders":
        if (!userId) {
          logError(endpoint, new Error("User ID missing"));
          return res.json({
            success: false,
            answer: "Please log in to view your orders.",
            showMenu: true,
          });
        }

        try {
          const { data } = await axios.get(`${BASE_URL}/Orders/buyer/${userId}`);

          if (!data.success || !Array.isArray(data.data))
            throw new Error("Unexpected format from orders API");

          if (data.data.length === 0) {
            answer = "📦 You don't have any orders yet. Start shopping now! 🛍️";
            logInfo(endpoint, "No orders found for user", { userId });
          } else {
            const orders = data.data.slice(0, 5);
            let orderList = "📦 **Your Recent Orders:**\n\n";
            orders.forEach((order, idx) => {
              orderList += `${idx + 1}. **${order.productId?.title?.en || "Product"}**\n   Status: ${
                order.status || "pending"
              }\n   Order ID: ${order._id}\n\n`;
            });
            answer = orderList + "Need help with a specific order? Use 'Track a specific order'.";
            logInfo(endpoint, "Fetched user orders successfully", { userId, count: orders.length });
          }
        } catch (error) {
          logError(endpoint, error, { userId });
          answer = "❌ Unable to fetch your orders right now. Please try again later.";
        }
        break;

      // ==================== CANCEL ORDER ====================
      case "Cancel an order":
        answer =
          "⚠️ **Order Cancellation requires admin approval.**\n\nTo cancel your order, please raise a cancellation request. Our team will review and process it within 24 hours.";
        redirectTo = "raiseQuery";
        showMenu = false;
        break;

      // ==================== PAYMENT ISSUES ====================
      case "Payment failed":
        answer =
          "💳 **Payment Failed?**\n\nThis could happen due to:\n• Insufficient balance\n• Bank downtime\n• Incorrect card details\n\n**Solutions:**\n1. Retry after a few minutes\n2. Use another payment method\n3. If amount was deducted, raise a concern and we'll assist soon.";
        redirectTo = "raiseQuery";
        showMenu = false;
        break;

      case "Refund not received":
        answer =
          "💰 **Refund Status:**\n\nRefunds take **3–5 business days** to reflect.\n\nIf it’s delayed, please raise a query with transaction details so our team can investigate.";
        redirectTo = "raiseQuery";
        showMenu = false;
        break;

      // ==================== WALLET ====================
      case "Add funds to wallet":
        answer =
          "💵 **Add Funds to Wallet:**\n\nRaise a query detailing:\n• Amount to add\n• Payment method\n• Transaction proof (if available)\n\nWe'll verify and credit within 2–4 hours.";
        redirectTo = "raiseQuery";
        showMenu = false;
        break;

      // ==================== DELIVERY & SHIPPING ====================
      case "Delayed delivery":
        answer =
          "📦 **Delivery Delayed?**\n\nApologies for the delay! Possible reasons:\n• Weather\n• Logistics issue\n• High demand\n\nRaise a concern with your Order ID and we’ll escalate the case.";
        redirectTo = "raiseQuery";
        showMenu = false;
        break;

      case "Change delivery address":
        answer =
          "📍 **Change Delivery Address:**\n\nCan be updated **before dispatch** from your order page.\nIf shipped, raise a query immediately with your updated address.";
        redirectTo = "raiseQuery";
        showMenu = false;
        break;

      case "Item damaged or missing":
        answer =
          "⚠️ **Item Damaged or Missing?**\n\nPlease:\n1. Take clear images\n2. Raise a concern with proof\n3. We'll resolve with a replacement or refund in 24 hours.";
        redirectTo = "raiseQuery";
        showMenu = false;
        break;

      // ==================== AD/SELLER REPORT ====================
      case "Report an ad or seller":
        answer =
          "🚨 **Report Ad or Seller:**\n\nProvide Ad ID, screenshots, and details. Our team will investigate and take necessary action within 24 hours.";
        redirectTo = "raiseQuery";
        showMenu = false;
        break;

      // ==================== CUSTOMER SUPPORT ====================
      case "Talk to a live agent":
        answer =
          "👩‍💼 **Live Support:**\n📧 support@yourshop.com\n📞 +91-1800-123-4567\n💬 WhatsApp: +91-9876543210\n\nMon–Sat, 9 AM–6 PM.\nRaise a query anytime for 2–4h response time!";
        redirectTo = "raiseQuery";
        showMenu = false;
        break;

      case "Request a call back":
        answer =
          "📞 **Request a Call Back:**\nWe'll contact you within **24 hours**.\nEnsure your phone number is verified and available between 9 AM–6 PM.";
        redirectTo = "raiseQuery";
        showMenu = false;
        break;

      case "Contact customer support":
        answer =
          "📞 **Customer Support:**\n📧 support@yourshop.com\n📱 +91-1800-123-4567\n💬 WhatsApp: +91-9876543210\n\nOperating Mon–Sat, 9 AM–6 PM.\nRaise a query anytime for faster assistance.";
        redirectTo = "raiseQuery";
        showMenu = false;
        break;

      // ==================== RETURN POLICY ====================
      case "Return or refund policy":
        answer =
          "🔄 **Return & Refund Policy:**\n\n✅ 15-day return window\n✅ Original packaging required\n✅ Refund in **5–7 business days**\n\n**Non-returnable items:** perishables, intimate goods, custom products.\nRaise a concern for assistance.";
        redirectTo = "raiseQuery";
        showMenu = false;
        break;

      // ==================== WALLET & ESCROW INFO ====================
      case "Wallet & Escrow help":
        answer =
          "💼 **Wallet & Escrow System:**\n\n**Wallet:** secure payments, cashback & rewards.\n**Escrow:** holds payment safely until delivery confirmation.\nNeed help? Raise a concern.";
        showMenu = true;
        break;

      // ==================== DEFAULT ====================
      default:
        answer = "🤔 I didn't quite understand that. Please select one of the options below to continue.";
        showMenu = true;
        break;
    }

    logInfo(endpoint, "Chat response prepared successfully", { question, redirectTo });

    return res.json({
      success: true,
      answer,
      showMenu,
      redirectTo,
    });
  } catch (error) {
    logError(endpoint, error, { body: req.body });
    return res.status(500).json({
      success: false,
      answer: "⚠️ Internal error occurred. Please try again later.",
      showMenu: true,
    });
  }
};
