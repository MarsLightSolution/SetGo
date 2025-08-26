import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { chatNotifications } from '../Notification/notification';

const NotificationContext = createContext();

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    
    if (userId || userEmail) {
      const socketInstance = io(`${import.meta.env.VITE_SERVER}`, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      socketInstance.on('connect', () => {
        console.log('Connected to notification server');
        setIsConnected(true);
        
        // Join user to receive notifications
        socketInstance.emit('join-user', userEmail || userId);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from notification server');
        setIsConnected(false);
      });

      // Listen for notifications
      socketInstance.on('notification', (notificationData) => {
        console.log('Received notification:', notificationData);
        const notificationWithId = {
          ...notificationData,
          id: notificationData.id || `socket_${Date.now()}_${Math.random()}`
        };
        addNotification(notificationWithId);
        
        // Show browser notification
        if (chatNotifications.isEnabled()) {
          chatNotifications.showBrowserNotification(
            notificationData.title,
            {
              body: notificationData.message,
              icon: '/favicon.ico',
              onClick: () => {
                handleNotificationClick(notificationData);
              }
            }
          );
        }
        
        // Play notification sound
        chatNotifications.playNotificationSound();
      });

      // Listen for new messages (if not already handled by chat)
      socketInstance.on('new-message', (messageData) => {
        const notification = {
          id: `msg_${Date.now()}`,
          type: 'message',
          title: `New message from ${messageData.senderName || 'Unknown'}`,
          message: messageData.message.content || messageData.message,
          timestamp: Date.now(),
          isRead: false,
          conversationId: messageData.conversationId,
          senderId: messageData.senderId
        };
        
        // Only show notification if user is not currently in the chat
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/chat')) {
          addNotification(notification);
          
          if (chatNotifications.isEnabled()) {
            chatNotifications.showMessageNotification(
              messageData.senderName || 'Unknown',
              messageData.message.content || messageData.message,
              'text',
              messageData.conversationId
            );
          }
        }
      });

      // Listen for product-related notifications
      socketInstance.on('product-notification', (data) => {
        const notification = {
          id: `product_${Date.now()}`,
          type: 'product',
          title: data.title,
          message: data.message,
          timestamp: Date.now(),
          isRead: false,
          productId: data.productId,
          userId: data.userId
        };
        
        addNotification(notification);
      });

      // Listen for like notifications
      socketInstance.on('like-notification', (data) => {
        const notification = {
          id: `like_${Date.now()}`,
          type: 'like',
          title: `${data.userName} liked your item`,
          message: data.productTitle,
          timestamp: Date.now(),
          isRead: false,
          productId: data.productId,
          userId: data.userId
        };
        
        addNotification(notification);
      });

      // Listen for system notifications
      socketInstance.on('system-notification', (data) => {
        const notification = {
          id: `system_${Date.now()}`,
          type: 'system',
          title: data.title,
          message: data.message,
          timestamp: Date.now(),
          isRead: false
        };
        
        addNotification(notification);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, []);

  // Load saved notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed);
          console.log('Loaded', parsed.length, 'notifications from localStorage');
        }
      } catch (error) {
        console.error('Error parsing saved notifications:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save notifications to localStorage whenever they change (but avoid overwriting on mount)
  useEffect(() => {
    if (isInitialized && notifications.length >= 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
      console.log('Saved', notifications.length, 'notifications to localStorage');
    }
  }, [notifications, isInitialized]);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      // Avoid duplicates
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      
      // Add new notification at the beginning
      const updated = [notification, ...prev];
      
      // Keep only last 50 notifications
      return updated.slice(0, 50);
    });
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  }, []);

  const clearNotification = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleNotificationClick = useCallback((notification) => {
    // Handle different notification types - this is used in the notifications page
    // The actual navigation should be handled by the component using this context
    console.log('Notification clicked:', notification);
    
    // Mark as read if not already read
    if (!notification.isRead) {
      const updatedNotifications = notifications.map(n => 
        n.id === notification.id ? { ...n, isRead: true } : n
      );
      setNotifications(updatedNotifications);
    }
  }, [notifications]);

  // Send notification through socket
  const sendNotification = useCallback((recipientId, notificationData) => {
    if (socket && isConnected) {
      socket.emit('send-notification', {
        recipientId,
        ...notificationData
      });
    }
  }, [socket, isConnected]);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const value = {
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
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;