# Notification System

A comprehensive real-time notification system built with React, Socket.IO, and MongoDB. This system provides both in-app notifications and browser notifications with a clean, user-friendly interface.

## Features

### 🔔 Core Features
- **Real-time notifications** via Socket.IO
- **Bell icon** with unread count in the navbar
- **Dropdown notification list** with different notification types
- **Browser notifications** with sound
- **Persistent storage** in MongoDB and localStorage
- **Multiple notification types**: messages, likes, products, system notifications
- **Mark as read/unread** functionality
- **Notification history** with timestamps

### 🎨 UI Components
- **NotificationBell**: Bell icon component with unread badge
- **NotificationContext**: Global state management
- **useNotifications**: Custom hook for easy integration
- **NotificationDemo**: Testing component (remove in production)

## Quick Start

### 1. Installation
All required dependencies are already included in the project:
- Frontend: `socket.io-client` 
- Backend: `socket.io`, `mongoose`

### 2. Backend Setup
The notification system is already integrated into your existing Socket.IO setup. The following are automatically available:

- **Model**: `backend/models/Notification.js`
- **Routes**: `backend/Routes/notificationRoutes.js` 
- **Socket Events**: Added to `backend/socket.js`

### 3. Frontend Setup
The notification system is wrapped around your entire app in `App.jsx`:

```jsx
import NotificationProvider from './contexts/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      {/* Your app content */}
    </NotificationProvider>
  );
}
```

## Usage

### Using the Notification Hook

```jsx
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const {
    notifications,
    unreadCount,
    isConnected,
    sendLikeNotification,
    sendMessageNotification,
    createLocalNotification,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  // Send a like notification
  const handleLike = () => {
    sendLikeNotification(
      'recipient@email.com',  // recipient
      'John Doe',             // sender name
      'MacBook Pro 2023',     // product title
      'product123'            // product ID
    );
  };

  // Create a local notification (for testing)
  const handleTest = () => {
    createLocalNotification(
      'system',
      'Test Notification',
      'This is a test message'
    );
  };

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Unread: {unreadCount}</p>
      <button onClick={handleLike}>Send Like</button>
      <button onClick={handleTest}>Test Notification</button>
    </div>
  );
}
```

### Notification Types

The system supports several notification types:

1. **message** - Chat messages
2. **like** - Product likes  
3. **product** - Product-related notifications
4. **system** - System announcements
5. **comment** - Comments on products
6. **follow** - User follows

### Sending Notifications

#### Via Socket.IO (Real-time)
```jsx
const { sendNotification } = useNotifications();

sendNotification('recipient@email.com', {
  type: 'product',
  title: 'New Product Available',
  message: 'iPhone 15 Pro Max just posted in your area',
  productId: 'product123'
});
```

#### Via REST API
```javascript
fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientId: 'user@email.com',
    type: 'system',
    title: 'Welcome!',
    message: 'Thanks for joining our platform'
  }),
  credentials: 'include'
});
```

## API Endpoints

### GET `/api/notifications`
Get all notifications for the authenticated user
- Query params: `page`, `limit`, `unreadOnly`

### GET `/api/notifications/unread-count`
Get unread notification count

### PATCH `/api/notifications/:id/read`
Mark specific notification as read

### PATCH `/api/notifications/mark-all-read`
Mark all notifications as read

### DELETE `/api/notifications/:id`
Delete specific notification

### DELETE `/api/notifications/read/all`
Delete all read notifications

### POST `/api/notifications`
Create new notification (admin/system use)

## Socket.IO Events

### Client → Server
- `send-notification` - Send notification to another user
- `mark-notification-read` - Mark notification as read
- `mark-all-notifications-read` - Mark all as read
- `get-notifications` - Get notification history

### Server → Client
- `notification` - Receive new notification
- `notification-sent` - Confirmation of sent notification
- `notification-error` - Error in notification handling
- `notifications-loaded` - Notification history loaded

## Browser Notifications

The system automatically requests browser notification permission and shows native notifications when:
- User is not on the current page
- Notification permission is granted
- New notifications are received

### Sound Notifications
Audio notifications are played using the Web Audio API with a customizable beep sound.

## Database Schema

```javascript
{
  recipientId: String,     // User receiving notification
  senderId: String,        // User sending notification (optional)
  type: String,           // Notification type (enum)
  title: String,          // Notification title (max 200 chars)
  message: String,        // Notification message (max 500 chars)
  isRead: Boolean,        // Read status
  metadata: {             // Additional type-specific data
    conversationId: String,
    productId: String,
    commentId: String,
    userId: String
  },
  createdAt: Date,        // Creation timestamp
  readAt: Date           // Read timestamp
}
```

## Integration Examples

### Chat Integration
```jsx
// In your chat component
const { sendMessageNotification } = useNotifications();

const sendMessage = async (message, conversationId) => {
  // Send message via your chat API
  await sendChatMessage(message, conversationId);
  
  // Notify other participants
  conversation.participants.forEach(participant => {
    if (participant.userId !== currentUserId) {
      sendMessageNotification(
        participant.userId,
        currentUserName,
        message,
        conversationId
      );
    }
  });
};
```

### Product Like Integration
Already implemented in the Home component:
```jsx
const handleLikeToggle = () => {
  if (!liked) {
    dispatch(like(ad));
    
    // Send notification to product owner
    if (ad.userId !== currentUserEmail) {
      sendLikeNotification(
        ad.userId,
        currentUserName,
        productTitle,
        ad._id
      );
    }
  }
};
```

## Customization

### Styling
The notification components use Tailwind CSS. Key classes:
- Bell icon: `text-green-900 hover:bg-lime-100`
- Dropdown: `bg-white shadow-lg rounded-lg border`
- Unread indicator: `bg-red-500 text-white`
- Notification items: `hover:bg-gray-50`

### Notification Icons
Customize notification icons in `NotificationBell.jsx`:
```jsx
const getNotificationIcon = (type) => {
  switch (type) {
    case 'message': return '💬';
    case 'like': return '❤️';
    case 'product': return '📦';
    case 'system': return '🔔';
    default: return '📢';
  }
};
```

### Sound Customization
Modify the notification sound in `Frontend/src/Notification/notification.js`:
```jsx
const createBeep = (frequency = 800, duration = 200) => {
  // Customize frequency and duration
};
```

## Testing

Use the **NotificationDemo** component (included on the homepage) to test all notification features:
1. Create different types of notifications
2. Test Socket.IO connectivity
3. Verify browser notifications
4. Test notification sounds

**Note**: Remove `NotificationDemo` from the Home component in production.

## Performance Considerations

- Notifications are limited to 50 per user in localStorage
- Database cleanup removes old notifications (keeps last 100 per user)
- Socket connections are properly cleaned up on disconnect
- Notification queries are indexed for performance

## Security

- All notification endpoints require authentication
- Users can only read/modify their own notifications
- Socket.IO events validate user permissions
- CORS is properly configured for your domain

## Browser Support

- **Modern browsers** with WebSocket support
- **Browser notifications** require user permission
- **Web Audio API** for notification sounds
- **localStorage** for offline persistence

## Troubleshooting

### Common Issues

1. **Notifications not showing**
   - Check Socket.IO connection status
   - Verify user authentication
   - Check browser notification permissions

2. **Socket connection fails**
   - Verify backend server is running on port 8080
   - Check CORS configuration
   - Ensure user is logged in

3. **No notification sounds**
   - Check browser audio permissions
   - Verify Web Audio API support
   - User interaction may be required to enable audio

### Debug Mode
Check browser console for notification system logs:
```javascript
// Enable debug logging
localStorage.setItem('debug', 'notification:*');
```

## License

This notification system is part of your application and follows the same license terms.