import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationDemo = () => {
  const {
    createLocalNotification,
    sendNotification,
    isConnected,
    notifications,
    unreadCount
  } = useNotifications();

  const handleCreateTestNotification = () => {
    createLocalNotification(
      'system',
      'Test Notification',
      'This is a test notification created locally',
      { testData: 'demo' }
    );
  };

  const handleCreateMessageNotification = () => {
    createLocalNotification(
      'message',
      'New Message from John',
      'Hey! How are you doing?',
      { conversationId: 'test123', senderId: 'john@example.com' }
    );
  };

  const handleCreateLikeNotification = () => {
    createLocalNotification(
      'like',
      'Someone liked your item',
      'MacBook Pro 2023',
      { productId: 'product123', userId: 'user456' }
    );
  };

  const handleCreateProductNotification = () => {
    createLocalNotification(
      'product',
      'New Product Available',
      'iPhone 15 Pro Max just posted in your area',
      { productId: 'iphone123' }
    );
  };

  const handleSendSocketNotification = () => {
    // This would send a notification to another user via Socket.IO
    const recipientId = prompt('Enter recipient email/ID:');
    if (recipientId) {
      sendNotification(recipientId, {
        type: 'system',
        title: 'Socket.IO Test',
        message: 'This notification was sent via Socket.IO',
        timestamp: Date.now()
      });
      alert('Notification sent via Socket.IO!');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto mt-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        🔔 Notification System Demo
      </h3>
      
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">
          <strong>Connection Status:</strong> {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Total Notifications:</strong> {notifications.length}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Unread Count:</strong> {unreadCount}
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Create Test Notifications:</h4>
        
        <button
          onClick={handleCreateTestNotification}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          📢 System Notification
        </button>

        <button
          onClick={handleCreateMessageNotification}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          💬 Message Notification
        </button>

        <button
          onClick={handleCreateLikeNotification}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          ❤️ Like Notification
        </button>

        <button
          onClick={handleCreateProductNotification}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          📦 Product Notification
        </button>

        <button
          onClick={handleSendSocketNotification}
          className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          disabled={!isConnected}
        >
          🚀 Send Socket.IO Notification
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>💡 Click the bell icon in the navbar to see notifications</p>
        <p>🔔 Browser notifications need permission to work</p>
      </div>
    </div>
  );
};

export default NotificationDemo;