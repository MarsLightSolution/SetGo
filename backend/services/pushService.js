const { Expo } = require('expo-server-sdk');
const Notification = require('../models/Notification');
const User = require('../models/user');
const logger = require('../utils/logger');

const expo = new Expo();

// Maps notification type + metadata to an Expo Router deep-link route
function resolveRoute(type, metadata = {}) {
  switch (type) {
    case 'message': return '/Chat/chat';
    case 'follow':  return metadata.userId ? `/UserInfo/Userinfo` : '/profile';
    case 'product': return metadata.orderId
      ? `/order/${metadata.orderId}`
      : metadata.productId
        ? `/product/${metadata.productId}`
        : '/orders';
    case 'system':  return '/notifications';
    default:        return '/notifications';
  }
}

/**
 * Creates a DB notification and sends an Expo push notification to the user.
 * Silently skips if the user has no push token registered.
 *
 * @param {string|ObjectId} recipientId - MongoDB _id of the recipient
 * @param {object} payload
 * @param {string} payload.type        - Notification type (message|follow|product|system)
 * @param {string} payload.title       - Notification title
 * @param {string} [payload.message]   - Notification body text
 * @param {string} [payload.senderId]  - MongoDB _id of the sender
 * @param {object} [payload.metadata]  - Extra data (conversationId, productId, userId, etc.)
 */
async function sendNotificationToUser(recipientId, { type, title, message, senderId, metadata = {} }) {
  try {
    const recipientStr = recipientId.toString();

    // 1. Save to DB
    await Notification.createNotification({
      recipientId: recipientStr,
      senderId: senderId?.toString(),
      type,
      title,
      message,
      metadata,
    });

    // 2. Look up push token
    const user = await User.findById(recipientId).select('pushToken');
    if (!user?.pushToken) return;

    const pushToken = user.pushToken;
    if (!Expo.isExpoPushToken(pushToken)) {
      logger.warn(`[PushService] Invalid push token for user ${recipientStr}`);
      return;
    }

    // 3. Resolve deep-link route from type + metadata
    const route = resolveRoute(type, metadata);

    // 4. Send via Expo push API
    const chunks = expo.chunkPushNotifications([{
      to: pushToken,
      sound: 'default',
      title,
      body: message || title,
      data: { type, route, ...metadata },
    }]);

    for (const chunk of chunks) {
      try {
        const receipts = await expo.sendPushNotificationsAsync(chunk);
        receipts.forEach((receipt) => {
          if (receipt.status === 'error') {
            logger.error(`[PushService] Delivery error: ${receipt.message}`);
          }
        });
      } catch (err) {
        logger.error(`[PushService] Chunk send failed: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error(`[PushService] sendNotificationToUser failed: ${err.message}`);
  }
}

module.exports = { sendNotificationToUser };
