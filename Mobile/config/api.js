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

// Production API (same server the website uses). Production EAS builds set it via eas.json;
// it is also the fallback outside development so a release build never points at a LAN IP.
export const PRODUCTION_API_URL = 'https://api.satgo.az';
const DEV_FALLBACK_URL = 'http://192.168.1.3:8080';
const IS_DEV = typeof __DEV__ !== 'undefined' && __DEV__;

// Builds on the production update channel only ever talk to an https API. Guards against an
// `eas update` bundled on a dev machine whose .env points at a LAN backend.
let UPDATE_CHANNEL = null;
try {
  UPDATE_CHANNEL = require('expo-updates').channel ?? null;
} catch {
  // expo-updates unavailable (e.g. web) — no channel
}
const fromEnv = (value) =>
  value && !(UPDATE_CHANNEL === 'production' && !value.startsWith('https://')) ? value : null;

// Base URL from env (e.g., http://192.168.1.3:8080 in development)
const BASE_URL = (fromEnv(process.env.EXPO_PUBLIC_API_URL) || (IS_DEV ? DEV_FALLBACK_URL : PRODUCTION_API_URL)).replace(/\/$/, '');

// API-prefixed URL for Express /api router routes
const API_URL = `${BASE_URL}/api`;

// Image/static assets URL
const IMAGE_BASE_URL = BASE_URL;

// WebSocket URL — set EXPO_PUBLIC_SOCKET_URL in .env
const SOCKET_URL = fromEnv(process.env.EXPO_PUBLIC_SOCKET_URL) || BASE_URL;

// Validate in development
if (!BASE_URL && typeof __DEV__ !== 'undefined' && __DEV__) {
  logger.error('EXPO_PUBLIC_API_URL is not set. Create a .env file with your API URL.');
}

// ============================================================
// Secured /api/v2 endpoints
// ============================================================
// The backend serves secured versions of many routes under /api/v2 (identity from the login
// token, ownership checks). Until that backend is deployed those paths don't exist, so the app
// probes once at startup and uses v2 only when the server has it; otherwise the older paths.
const V2 = `${BASE_URL}/api/v2`;
let apiV2Available = false;
let apiV2Probe = null;
export const isApiV2 = () => apiV2Available;
const pick = (v2Url, legacyUrl) => (apiV2Available ? v2Url : legacyUrl);

/**
 * Detect /api/v2: v2 answers GET /auth/check-status (no email) with a JSON 400; an older
 * server has no such route and answers 404. Safe to call repeatedly; retries after failures.
 */
export const detectApiV2 = () => {
  if (apiV2Available) return Promise.resolve(true);
  if (!apiV2Probe) {
    apiV2Probe = fetch(`${V2}/auth/check-status`, { headers: { Accept: 'application/json' } })
      .then((res) => {
        apiV2Available = res.status === 400 && (res.headers.get('content-type') || '').includes('json');
        logger.info(`API v2 ${apiV2Available ? 'available' : 'not available'} (status ${res.status})`);
        return apiV2Available;
      })
      .catch(() => false)
      .finally(() => {
        apiV2Probe = null;
      });
  }
  return apiV2Probe;
};
detectApiV2();

/**
 * GET a v2-only public read, falling back to the older route when the server doesn't have
 * it yet (not a v2 server, or a v2 server from before that endpoint: 404).
 */
export const fetchV2OrLegacy = async (v2Url, legacyUrl, init) => {
  if (apiV2Available) {
    const res = await fetch(v2Url, init);
    if (res.status !== 404) return res;
  }
  return fetch(legacyUrl, init);
};

// Public website (share links must open a page, not the JSON API).
export const WEB_URL = 'https://satgo.az';
export const WEB_LINKS = {
  product: (id) => `${WEB_URL}/product/${encodeURIComponent(id)}`,
  shop: (slugOrId) => `${WEB_URL}/shop/${encodeURIComponent(slugOrId)}`,
};

/** Socket event name: "v2:<name>" on a v2 server (those handlers verify the user). */
export const socketEvent = (name) => (apiV2Available ? `v2:${name}` : name);

// ============================================================
// All endpoints organized by backend route file
// ============================================================
export const API_ENDPOINTS = {

  // --- Auth (Authroutes.js) - root level ---
  LOGIN: `${BASE_URL}/login`,
  SIGNUP: `${BASE_URL}/signup`,
  VERIFY_EMAIL: `${BASE_URL}/verifyemail`,
  get CHECK_STATUS() { return pick(`${V2}/auth/check-status`, `${BASE_URL}/check-status`); },
  REFRESH_TOKEN: `${BASE_URL}/refreshAccessToken`,
  LOGOUT: `${BASE_URL}/logout`,
  FORGOT_PASSWORD: `${BASE_URL}/forgotpassword`,
  VERIFY_TOKEN: `${BASE_URL}/verifytoken`,
  RESET_PASSWORD: `${BASE_URL}/resetpassword`,
  PROTECTED: `${BASE_URL}/protected`,

  // --- Users (userRouter.js) - root level ---
  get GET_USERS() { return pick(`${V2}/users/get-users`, `${BASE_URL}/users/get-users`); },
  GET_USER: (id) => pick(`${V2}/users/get-users/${id}`, `${BASE_URL}/users/get-users/${id}`),
  USER_TRANSACTIONS: (id) => pick(`${V2}/users/${id}/transactions`, `${BASE_URL}/users/${id}/transactions`),
  USER_WALLET: (id) => pick(`${V2}/users/${id}/wallet`, `${BASE_URL}/users/${id}/wallet`),

  // --- Profile (Profileroutes.js) - root level ---
  USER_DATA: (id) => pick(`${V2}/profile/userdata/${id}`, `${BASE_URL}/userdata/${id}`),
  UPDATE_PROFILE_NAME: (id) => pick(`${V2}/profile/nameupdate/${id}/profileName`, `${BASE_URL}/nameupdate/${id}/profileName`),
  UPDATE_DELIVERY_ADDRESS: (id) => pick(`${V2}/profile/deliveryaddress/${id}/delivery-Address`, `${BASE_URL}/deliveryaddress/${id}/delivery-Address`),
  UPDATE_BILLING_ADDRESS: (id) => pick(`${V2}/profile/billingaddress/${id}/billingAddress`, `${BASE_URL}/billingaddress/${id}/billingAddress`),
  DELETE_USER: (id) => pick(`${V2}/profile/deleteuser/${id}`, `${BASE_URL}/deleteuser/${id}`),
  NEWSLETTER: (id) => pick(`${V2}/profile/newsletter/${id}`, `${BASE_URL}/newsletter/${id}`),
  USER_MESSAGES: (id) => pick(`${V2}/profile/messageforuser/${id}`, `${BASE_URL}/messageforuser/${id}`),
  UPDATE_PASSWORD: (id) => pick(`${V2}/profile/updatepassword/${id}`, `${BASE_URL}/updatepassword/${id}`),
  // v2 only: own password, current password checked. Older servers: UPDATE_PASSWORD.
  CHANGE_PASSWORD: `${V2}/profile/change-password`,
  get EMAIL_VERIFY() { return pick(`${V2}/profile/emailverify`, `${BASE_URL}/emailverify`); },
  get VERIFY_PHONE_UPDATE() { return pick(`${V2}/profile/verifyphoneupdate`, `${BASE_URL}/verifyphoneupdate`); },

  // --- OTP (Twillioroutes.js) - root level ---
  get SEND_OTP() { return pick(`${V2}/otp/send-otp`, `${BASE_URL}/send-otp`); },
  get VERIFY_OTP() { return pick(`${V2}/otp/verify-otp`, `${BASE_URL}/verify-otp`); },

  // --- Orders (Order.js) - root level ---
  get ORDERS() { return pick(`${V2}/orders`, `${BASE_URL}/Orders`); },
  SELLER_ORDERS: (sellerId) => pick(`${V2}/orders/seller/${sellerId}`, `${BASE_URL}/Orders/seller/${sellerId}`),
  USER_ORDERS: (userId) => pick(`${V2}/orders/user/${userId}`, `${BASE_URL}/Orders/user/${userId}`),
  ORDER_DETAIL: (id) => pick(`${V2}/orders/${id}`, `${BASE_URL}/Orders/${id}`),
  ORDER_TRACKING: (orderId) => pick(`${V2}/orders/${orderId}/tracking`, `${BASE_URL}/Orders/${orderId}/tracking`),

  // --- Followers (Followerroutes.js) - root level ---
  FOLLOW: (id) => pick(`${V2}/follow/${id}/follow`, `${BASE_URL}/follow/${id}`),
  UNFOLLOW: (id) => pick(`${V2}/follow/${id}/unfollow`, `${BASE_URL}/unfollow/${id}`),
  CHECK_FOLLOW: (followerId, followingId) => `${BASE_URL}/check/${followerId}/${followingId}`,
  GET_FOLLOWERS: (id) => pick(`${V2}/follow/${id}/followers`, `${BASE_URL}/${id}/followers`),
  GET_FOLLOWING: (id) => pick(`${V2}/follow/${id}/following`, `${BASE_URL}/${id}/following`),

  // --- Reviews (reviewRoutes.js) - root level ---
  get REVIEWS() { return pick(`${V2}/reviews`, `${BASE_URL}/reviews`); },
  REVIEW_CONFIRM_DELIVERY: (orderId) => pick(`${V2}/reviews/orders/${orderId}/confirm-delivery`, `${BASE_URL}/reviews/orders/${orderId}/confirm-delivery`),
  // v2 only (buyer from token; also accepts shipped orders). Older servers: REVIEW_CONFIRM_DELIVERY.
  ORDER_CONFIRM_RECEIPT: (orderId) => `${V2}/orders/${orderId}/confirm-receipt`,
  get REVIEWS_PENDING() { return pick(`${V2}/reviews/pending`, `${BASE_URL}/reviews/pending`); },
  get REVIEWS_USER() { return pick(`${V2}/reviews/user`, `${BASE_URL}/reviews/user`); },
  REVIEW_UPDATE: (reviewId) => pick(`${V2}/reviews/${reviewId}`, `${BASE_URL}/reviews/${reviewId}`),
  REVIEW_DELETE: (reviewId) => pick(`${V2}/reviews/${reviewId}`, `${BASE_URL}/reviews/${reviewId}`),
  REVIEW_HELPFUL: (reviewId) => pick(`${V2}/reviews/${reviewId}/helpful`, `${BASE_URL}/reviews/${reviewId}/helpful`),
  REVIEWS_PRODUCT: (productId) => `${BASE_URL}/reviews/product/${productId}`,
  REVIEWS_PRODUCT_SUMMARY: (productId) => `${BASE_URL}/reviews/product/${productId}/summary`,
  get REVIEWS_SELLER() { return pick(`${V2}/reviews/seller`, `${BASE_URL}/reviews/seller`); },
  REVIEW_SELLER_RESPONSE: (reviewId) => pick(`${V2}/reviews/${reviewId}/seller-response`, `${BASE_URL}/reviews/${reviewId}/seller-response`),

  // --- Notifications (notificationRoutes.js) - /api prefix ---
  // Backend mounts these under /api/notifications (Routes/index.js); /notifications 404s.
  NOTIFICATIONS: `${API_URL}/notifications`,
  NOTIFICATIONS_UNREAD: `${API_URL}/notifications/unread-count`,
  NOTIFICATION_READ: (id) => `${API_URL}/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: `${API_URL}/notifications/mark-all-read`,
  NOTIFICATION_DELETE: (id) => `${API_URL}/notifications/${id}`,
  NOTIFICATIONS_DELETE_READ: `${API_URL}/notifications/read/all`,
  // v2: a device token belongs to one account (moved on login, DELETE at logout)
  get PUSH_TOKEN() { return pick(`${V2}/notifications/push-token`, `${API_URL}/notifications/push-token`); },

  // --- Chatbot (ChatbotRoutes.js) - root level ---
  get CHATBOT_ASK() { return pick(`${V2}/chatbot/ask`, `${BASE_URL}/chatbot/ask`); },

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
  get ERROR_LOG_REPORT() { return pick(`${V2}/logs/error`, `${BASE_URL}/logs/error`); },
  get ERROR_LOG_LIST() { return pick(`${V2}/logs/error/db`, `${BASE_URL}/logs/error/db`); },
  ERROR_LOG_RESOLVE: (id) => pick(`${V2}/logs/error/${id}/resolve`, `${BASE_URL}/logs/error/${id}/resolve`),

  // --- Redis (redisRoutes.js) - root level ---
  get REDIS_CLEAR() { return pick(`${V2}/redis/clear-cache`, `${BASE_URL}/redis/clear-cache`); },

  // --- Products (product.route.js) - /api prefixed ---
  get ADD_PRODUCT() { return pick(`${V2}/products/add`, `${API_URL}/products/add`); },
  GET_PRODUCTS: `${API_URL}/products/getProducts`,
  GET_PRODUCT: (id) => `${API_URL}/products/product/${id}`,
  USER_ADS: (userId) => `${API_URL}/products/user/${userId}/ads`,
  DELETE_PRODUCT: (id) => pick(`${V2}/products/product/${id}`, `${API_URL}/products/product/${id}`),
  UPDATE_PRODUCT: (id) => pick(`${V2}/products/product/${id}`, `${API_URL}/products/product/${id}`),
  NEARBY_PRODUCTS: `${API_URL}/products/nearby`,
  PRODUCTS_TRY: `${API_URL}/products/try`,
  MARK_SOLD: (productId) => pick(`${V2}/products/mark-sold/${productId}`, `${API_URL}/products/mark-sold/${productId}`),
  PRODUCTS_BY_CATEGORY: (category) => `${API_URL}/products/category/${encodeURIComponent(category)}`,
  // v2 only (use with fetchV2OrLegacy): plain-text match on category.en/az/ru. The old route
  // compares against the whole multi-language object and never matches.
  CATALOG_CATEGORY: (category) => `${V2}/catalog/category/${encodeURIComponent(category)}`,
  PRIORITY_PRODUCTS: `${API_URL}/products/priority`,
  UPDATE_PRIORITY: (productId) => pick(`${V2}/products/priority/${productId}`, `${API_URL}/products/priority/${productId}`),

  // --- Shops (shopRoutes.js) - /api prefixed ---
  MY_SHOP: `${API_URL}/shops/my-shop`,
  GET_SHOPS: `${API_URL}/shops`,
  GET_SHOP: (id) => `${API_URL}/shops/${id}`,
  // v2 only (use with fetchV2OrLegacy): same data without the owner's personal email/phone.
  CATALOG_SHOP: (id) => `${V2}/catalog/shops/${encodeURIComponent(id)}`,
  SHOP_PRODUCTS: (id) => `${API_URL}/shops/${id}/products`,
  CREATE_SHOP: `${API_URL}/shops`,
  UPDATE_SHOP: (id) => `${API_URL}/shops/${id}`,
  DELETE_SHOP: (id) => `${API_URL}/shops/${id}`,
  FOLLOW_SHOP: (id) => `${API_URL}/shops/${id}/follow`,

  // --- Chat (chat.js) - /api prefixed ---
  get CHAT_CONNECT() { return pick(`${V2}/chat/connect`, `${API_URL}/chat/connect`); },
  get CHAT_USERS() { return pick(`${V2}/chat/users`, `${API_URL}/chat/users`); },
  CHAT_USER: (username) => pick(`${V2}/chat/user/${username}`, `${API_URL}/chat/user/${username}`),
  CHAT_CONVERSATIONS: (userIdentifier) => pick(`${V2}/chat/conversations/${userIdentifier}`, `${API_URL}/chat/conversations/${userIdentifier}`),
  get CHAT_CREATE_CONVERSATION() { return pick(`${V2}/chat/conversations`, `${API_URL}/chat/conversations`); },
  CHAT_MESSAGES: (conversationId) => pick(`${V2}/chat/messages/${conversationId}`, `${API_URL}/chat/messages/${conversationId}`),
  get CHAT_SEND_MESSAGE() { return pick(`${V2}/chat/messages`, `${API_URL}/chat/messages`); },
  get CHAT_UPLOAD() { return pick(`${V2}/chat/upload`, `${API_URL}/chat/upload`); },
  get CHAT_GET_OR_CREATE() { return pick(`${V2}/chat/conversation/get-or-create`, `${API_URL}/chat/conversation/get-or-create`); },

  // --- Payments (payment-proxy.routes.js) - /api prefixed ---
  PAYMENT_INITIATE: `${API_URL}/payments/initiate`,
  PAYMENT_ORDER: (orderId) => `${API_URL}/payments/order/${orderId}`,
  PAYMENT_ORDERS: `${API_URL}/payments/orders`,
  PAYMENT_CANCEL: (orderId) => `${API_URL}/payments/order/${orderId}/cancel`,

  // --- Transaction (transaction.route.js) - /api prefixed ---
  TRANSFER_FUND: `${API_URL}/transaction/transferFund`,
};

export { BASE_URL, API_URL, IMAGE_BASE_URL, SOCKET_URL };
