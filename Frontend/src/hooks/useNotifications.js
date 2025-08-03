import { useNotificationContext } from '../contexts/NotificationContext';

export const useNotifications = () => {
  const context = useNotificationContext();
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  const {
    notifications,
    unreadCount,
    isConnected,
    socket,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    sendNotification,
    handleNotificationClick
  } = context;

  // Helper function to send different types of notifications
  const sendMessageNotification = (recipientId, senderName, message, conversationId) => {
    sendNotification(recipientId, {
      type: 'message',
      title: `New message from ${senderName}`,
      message: message,
      metadata: {
        conversationId: conversationId
      },
      timestamp: Date.now()
    });
  };

  const sendLikeNotification = (recipientId, userName, productTitle, productId) => {
    sendNotification(recipientId, {
      type: 'like',
      title: `${userName} liked your item`,
      message: productTitle,
      metadata: {
        productId: productId,
        userId: recipientId
      },
      timestamp: Date.now()
    });
  };

  const sendProductNotification = (recipientId, title, message, productId) => {
    sendNotification(recipientId, {
      type: 'product',
      title: title,
      message: message,
      metadata: {
        productId: productId
      },
      timestamp: Date.now()
    });
  };

  const sendSystemNotification = (recipientId, title, message) => {
    sendNotification(recipientId, {
      type: 'system',
      title: title,
      message: message,
      timestamp: Date.now()
    });
  };

  // Helper function to create local notifications (for testing or immediate feedback)
  const createLocalNotification = (type, title, message, extraData = {}) => {
    const notification = {
      id: `local_${type}_${Date.now()}`,
      type: type,
      title: title,
      message: message,
      timestamp: Date.now(),
      isRead: false,
      ...extraData
    };
    
    addNotification(notification);
    return notification;
  };

  // Get notifications by type
  const getNotificationsByType = (type) => {
    return notifications.filter(notification => notification.type === type);
  };

  // Get recent notifications (last 24 hours)
  const getRecentNotifications = () => {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return notifications.filter(notification => notification.timestamp > oneDayAgo);
  };

  // Get unread notifications
  const getUnreadNotifications = () => {
    return notifications.filter(notification => !notification.isRead);
  };

  return {
    // State
    notifications,
    unreadCount,
    isConnected,
    socket,

    // Basic actions
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    handleNotificationClick,

    // Sending notifications
    sendNotification,
    sendMessageNotification,
    sendLikeNotification,
    sendProductNotification,
    sendSystemNotification,

    // Utility functions
    createLocalNotification,
    getNotificationsByType,
    getRecentNotifications,
    getUnreadNotifications
  };
};

export default useNotifications;