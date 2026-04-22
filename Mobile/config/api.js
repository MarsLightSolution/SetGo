/**
 * API Configuration - Single Source of Truth
 *
 * IMPORTANT: Set your API URL in the .env file:
 * EXPO_PUBLIC_API_URL=http://192.168.1.3:8080
 * EXPO_PUBLIC_SOCKET_URL=ws://192.168.1.3:8080
 *
 * Backend routing:
 * - Express root-level routes (no prefix): /login, /signup, /userdata, /Orders, etc.
 * - Express /api router routes (with /api prefix): /api/products/*, /api/shops/*, /api/chat/*
 *
 * ALL files must import from this config. Do NOT use process.env.EXPO_PUBLIC_API_URL directly.
 */

import logger from '../utils/logger';

// Base URL from env (e.g., http://192.168.1.3:8080)
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.3:8080').replace(/\/$/, '');

// API-prefixed URL for Express /api router routes
const API_URL = `${BASE_URL}/api`;

// Image/static assets URL
const IMAGE_BASE_URL = BASE_URL;

// WebSocket URL — set EXPO_PUBLIC_SOCKET_URL in .env
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'ws://192.168.1.3:8080';

// Validate in development
if (!BASE_URL && typeof __DEV__ !== 'undefined' && __DEV__) {
  logger.error('EXPO_PUBLIC_API_URL is not set. Create a .env file with your API URL.');
}

// ============================================================
// All endpoints organized by backend route file
// ============================================================
export const API_ENDPOINTS = {

  // --- Auth (Authroutes.js) - root level ---
  LOGIN: `${BASE_URL}/login`,
  SIGNUP: `${BASE_URL}/signup`,
  VERIFY_EMAIL: `${BASE_URL}/verifyemail`,
  CHECK_STATUS: `${BASE_URL}/check-status`,
  REFRESH_TOKEN: `${BASE_URL}/refreshAccessToken`,
  LOGOUT: `${BASE_URL}/logout`,
  FORGOT_PASSWORD: `${BASE_URL}/forgotpassword`,
  VERIFY_TOKEN: `${BASE_URL}/verifytoken`,
  RESET_PASSWORD: `${BASE_URL}/resetpassword`,
  PROTECTED: `${BASE_URL}/protected`,

  // --- Users (userRouter.js) - root level ---
  GET_USERS: `${BASE_URL}/users/get-users`,
  GET_USER: (id) => `${BASE_URL}/users/get-users/${id}`,
  USER_TRANSACTIONS: (id) => `${BASE_URL}/users/${id}/transactions`,
  USER_WALLET: (id) => `${BASE_URL}/users/${id}/wallet`,

  // --- Profile (Profileroutes.js) - root level ---
  USER_DATA: (id) => `${BASE_URL}/userdata/${id}`,
  UPDATE_PROFILE_NAME: (id) => `${BASE_URL}/nameupdate/${id}/profileName`,
  UPDATE_DELIVERY_ADDRESS: (id) => `${BASE_URL}/deliveryaddress/${id}/delivery-Address`,
  UPDATE_BILLING_ADDRESS: (id) => `${BASE_URL}/billingaddress/${id}/billingAddress`,
  DELETE_USER: (id) => `${BASE_URL}/deleteuser/${id}`,
  NEWSLETTER: (id) => `${BASE_URL}/newsletter/${id}`,
  USER_MESSAGES: (id) => `${BASE_URL}/messageforuser/${id}`,
  UPDATE_PASSWORD: (id) => `${BASE_URL}/updatepassword/${id}`,
  EMAIL_VERIFY: `${BASE_URL}/emailverify`,
  VERIFY_PHONE_UPDATE: `${BASE_URL}/verifyphoneupdate`,

  // --- OTP (Twillioroutes.js) - root level ---
  SEND_OTP: `${BASE_URL}/send-otp`,
  VERIFY_OTP: `${BASE_URL}/verify-otp`,

  // --- Orders (Order.js) - root level ---
  ORDERS: `${BASE_URL}/Orders`,
  SELLER_ORDERS: (sellerId) => `${BASE_URL}/Orders/seller/${sellerId}`,
  USER_ORDERS: (userId) => `${BASE_URL}/Orders/user/${userId}`,
  ORDER_DETAIL: (id) => `${BASE_URL}/Orders/${id}`,
  ORDER_TRACKING: (orderId) => `${BASE_URL}/Orders/${orderId}/tracking`,

  // --- Followers (Followerroutes.js) - root level ---
  FOLLOW: (id) => `${BASE_URL}/follow/${id}`,
  UNFOLLOW: (id) => `${BASE_URL}/unfollow/${id}`,
  CHECK_FOLLOW: (followerId, followingId) => `${BASE_URL}/check/${followerId}/${followingId}`,
  GET_FOLLOWERS: (id) => `${BASE_URL}/${id}/followers`,
  GET_FOLLOWING: (id) => `${BASE_URL}/${id}/following`,

  // --- Reviews (reviewRoutes.js) - root level ---
  REVIEWS: `${BASE_URL}/reviews`,
  REVIEW_CONFIRM_DELIVERY: (orderId) => `${BASE_URL}/reviews/orders/${orderId}/confirm-delivery`,
  REVIEWS_PENDING: `${BASE_URL}/reviews/pending`,
  REVIEWS_USER: `${BASE_URL}/reviews/user`,
  REVIEW_UPDATE: (reviewId) => `${BASE_URL}/reviews/${reviewId}`,
  REVIEW_DELETE: (reviewId) => `${BASE_URL}/reviews/${reviewId}`,
  REVIEW_HELPFUL: (reviewId) => `${BASE_URL}/reviews/${reviewId}/helpful`,
  REVIEWS_PRODUCT: (productId) => `${BASE_URL}/reviews/product/${productId}`,
  REVIEWS_PRODUCT_SUMMARY: (productId) => `${BASE_URL}/reviews/product/${productId}/summary`,
  REVIEWS_SELLER: `${BASE_URL}/reviews/seller`,
  REVIEW_SELLER_RESPONSE: (reviewId) => `${BASE_URL}/reviews/${reviewId}/seller-response`,

  // --- Notifications (notificationRoutes.js) - root level ---
  NOTIFICATIONS: `${BASE_URL}/notifications`,
  NOTIFICATIONS_UNREAD: `${BASE_URL}/notifications/unread-count`,
  NOTIFICATION_READ: (id) => `${BASE_URL}/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: `${BASE_URL}/notifications/mark-all-read`,
  NOTIFICATION_DELETE: (id) => `${BASE_URL}/notifications/${id}`,
  NOTIFICATIONS_DELETE_READ: `${BASE_URL}/notifications/read/all`,

  // --- Chatbot (ChatbotRoutes.js) - root level ---
  CHATBOT_ASK: `${BASE_URL}/chatbot/ask`,

  // --- Concern/Support (concernRoutes.js) - root level ---
  CONCERN_RAISE: `${BASE_URL}/concern/raise`,
  CONCERN_USER: `${BASE_URL}/concern/user`,
  CONCERN_ALL: `${BASE_URL}/concern/all`,
  CONCERN_DETAIL: (id) => `${BASE_URL}/concern/${id}`,
  CONCERN_RESPONSE: (id) => `${BASE_URL}/concern/${id}/response`,
  CONCERN_STATUS: (id) => `${BASE_URL}/concern/${id}/status`,
  CONCERN_CLOSE: (id) => `${BASE_URL}/concern/${id}/close`,
  CONCERN_REOPEN: (id) => `${BASE_URL}/concern/${id}/reopen`,

  // --- Error logs (logRoutes.js) - root level ---
  ERROR_LOG_REPORT: `${BASE_URL}/logs/error`,
  ERROR_LOG_LIST: `${BASE_URL}/logs/error/db`,
  ERROR_LOG_RESOLVE: (id) => `${BASE_URL}/logs/error/${id}/resolve`,

  // --- Redis (redisRoutes.js) - root level ---
  REDIS_CLEAR: `${BASE_URL}/redis/clear-cache`,

  // --- Products (product.route.js) - /api prefixed ---
  ADD_PRODUCT: `${API_URL}/products/add`,
  GET_PRODUCTS: `${API_URL}/products/getProducts`,
  GET_PRODUCT: (id) => `${API_URL}/products/product/${id}`,
  USER_ADS: (userId) => `${API_URL}/products/user/${userId}/ads`,
  DELETE_PRODUCT: (id) => `${API_URL}/products/product/${id}`,
  UPDATE_PRODUCT: (id) => `${API_URL}/products/product/${id}`,
  NEARBY_PRODUCTS: `${API_URL}/products/nearby`,
  PRODUCTS_TRY: `${API_URL}/products/try`,
  MARK_SOLD: (productId) => `${API_URL}/products/mark-sold/${productId}`,
  PRODUCTS_BY_CATEGORY: (category) => `${API_URL}/products/category/${encodeURIComponent(category)}`,
  PRIORITY_PRODUCTS: `${API_URL}/products/priority`,
  UPDATE_PRIORITY: (productId) => `${API_URL}/products/priority/${productId}`,

  // --- Shops (shopRoutes.js) - /api prefixed ---
  MY_SHOP: `${API_URL}/shops/my-shop`,
  GET_SHOPS: `${API_URL}/shops`,
  GET_SHOP: (id) => `${API_URL}/shops/${id}`,
  SHOP_PRODUCTS: (id) => `${API_URL}/shops/${id}/products`,
  CREATE_SHOP: `${API_URL}/shops`,
  UPDATE_SHOP: (id) => `${API_URL}/shops/${id}`,
  DELETE_SHOP: (id) => `${API_URL}/shops/${id}`,
  FOLLOW_SHOP: (id) => `${API_URL}/shops/${id}/follow`,

  // --- Chat (chat.js) - /api prefixed ---
  CHAT_CONNECT: `${API_URL}/chat/connect`,
  CHAT_USERS: `${API_URL}/chat/users`,
  CHAT_USER: (username) => `${API_URL}/chat/user/${username}`,
  CHAT_CONVERSATIONS: (userIdentifier) => `${API_URL}/chat/conversations/${userIdentifier}`,
  CHAT_CREATE_CONVERSATION: `${API_URL}/chat/conversations`,
  CHAT_MESSAGES: (conversationId) => `${API_URL}/chat/messages/${conversationId}`,
  CHAT_SEND_MESSAGE: `${API_URL}/chat/messages`,
  CHAT_UPLOAD: `${API_URL}/chat/upload`,
  CHAT_GET_OR_CREATE: `${API_URL}/chat/conversation/get-or-create`,

  // --- Payments (payment-proxy.routes.js) - /api prefixed ---
  PAYMENT_INITIATE: `${API_URL}/payments/initiate`,
  PAYMENT_ORDER: (orderId) => `${API_URL}/payments/order/${orderId}`,
  PAYMENT_ORDERS: `${API_URL}/payments/orders`,
  PAYMENT_CANCEL: (orderId) => `${API_URL}/payments/order/${orderId}/cancel`,

  // --- Transaction (transaction.route.js) - /api prefixed ---
  TRANSFER_FUND: `${API_URL}/transaction/transferFund`,
};

export { BASE_URL, API_URL, IMAGE_BASE_URL, SOCKET_URL };
