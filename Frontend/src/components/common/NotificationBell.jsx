import React, { useState, useRef, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../Hooks/useNotifications.js';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Handle different notification types
    if (notification.type === 'message' && notification.metadata?.conversationId) {
      // Navigate to chat
      navigate(`/chat?conversation=${notification.metadata.conversationId}`);
    } else if (notification.type === 'product' && notification.metadata?.productId) {
      // Navigate to product
      navigate(`/product/${notification.metadata.productId}`);
    } else if (notification.type === 'like' && notification.metadata?.productId) {
      // Navigate to product that was liked
      navigate(`/product/${notification.metadata.productId}`);
    }
    
    setIsOpen(false);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'like':
        return '❤️';
      case 'product':
        return '📦';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-green-900 hover:bg-lime-100 rounded-full transition-colors duration-200"
        title="Notifications"
      >
        <FaBell className="text-lg" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  markAllAsRead();
                  setIsOpen(false);
                }}
                className="text-sm text-lime-600 hover:text-lime-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <FaBell className="mx-auto mb-2 text-gray-300 text-2xl" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                    !notification.isRead ? 'bg-lime-50 border-l-4 border-l-lime-400' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-lime-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="text-sm text-lime-600 hover:text-lime-700 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;