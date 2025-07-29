import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { FaBell, FaTrash, FaCheck, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    getNotificationsByType,
    getUnreadNotifications,
    handleNotificationClick
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // all, unread, messages, likes, products, system
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const filteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return getUnreadNotifications();
      case 'messages':
        return getNotificationsByType('message');
      case 'likes':
        return getNotificationsByType('like');
      case 'products':
        return getNotificationsByType('product');
      case 'system':
        return getNotificationsByType('system');
      default:
        return notifications;
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    const diffInDays = Math.floor(diffInMinutes / 1440);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return notificationTime.toLocaleDateString();
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

  const handleNotificationItemClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Handle navigation based on notification type
    if (notification.type === 'message' && notification.metadata?.conversationId) {
      navigate(`/chat?conversation=${notification.metadata.conversationId}`);
    } else if (notification.type === 'product' && notification.metadata?.productId) {
      navigate(`/product/${notification.metadata.productId}`);
    } else if (notification.type === 'like' && notification.metadata?.productId) {
      navigate(`/product/${notification.metadata.productId}`);
    }
    
    // Also call the context handler for any additional logic
    handleNotificationClick(notification);
  };

  const handleDeleteNotification = (notificationId, e) => {
    e.stopPropagation();
    clearNotification(notificationId);
  };

  const handleClearAll = () => {
    clearAllNotifications();
    setShowConfirmDelete(false);
  };

  const filterCounts = {
    all: notifications.length,
    unread: unreadCount,
    messages: getNotificationsByType('message').length,
    likes: getNotificationsByType('like').length,
    products: getNotificationsByType('product').length,
    system: getNotificationsByType('system').length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back
              </button>
              <FaBell className="text-2xl text-lime-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors"
                >
                  <FaCheck className="text-sm" />
                  Mark All Read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FaTrash className="text-sm" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FaFilter className="text-gray-600" />
            <span className="font-medium text-gray-800">Filter notifications:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: filterCounts.all },
              { key: 'unread', label: 'Unread', count: filterCounts.unread },
              { key: 'messages', label: 'Messages', count: filterCounts.messages },
              { key: 'likes', label: 'Likes', count: filterCounts.likes },
              { key: 'products', label: 'Products', count: filterCounts.products },
              { key: 'system', label: 'System', count: filterCounts.system }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption.key
                    ? 'bg-lime-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
                {filterOption.count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    filter === filterOption.key 
                      ? 'bg-white text-lime-600' 
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {filterOption.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredNotifications().length === 0 ? (
            <div className="p-12 text-center">
              <FaBell className="mx-auto mb-4 text-gray-300 text-4xl" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
              </h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? "You'll receive notifications here when there's activity on your account."
                  : `Try selecting a different filter to see other notifications.`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications().map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationItemClick(notification)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-lime-50 border-l-4 border-l-lime-400' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-2xl flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm ${
                              !notification.isRead 
                                ? 'font-semibold text-gray-900' 
                                : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-lime-500 rounded-full flex-shrink-0 mt-2 ml-3"></div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteNotification(notification.id, e)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete notification"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clear All Confirmation Modal */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Clear All Notifications?
              </h3>
              <p className="text-gray-600 mb-4">
                This will permanently delete all notifications. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;