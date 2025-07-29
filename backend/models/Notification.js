const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: false
  },
  type: {
    type: String,
    required: true,
    enum: ['message', 'like', 'product', 'system', 'comment', 'follow']
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: false,
    maxlength: 500
  },
  isRead: {
    type: Boolean,
    default: false
  },
  // Additional data based on notification type
  metadata: {
    conversationId: String,
    productId: String,
    commentId: String,
    userId: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = function(recipientId) {
  return this.countDocuments({ recipientId, isRead: false });
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = function(recipientId) {
  return this.updateMany(
    { recipientId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to create a notification
notificationSchema.statics.createNotification = function(data) {
  return this.create({
    recipientId: data.recipientId,
    senderId: data.senderId,
    type: data.type,
    title: data.title,
    message: data.message,
    metadata: data.metadata || {}
  });
};

// Auto-delete old notifications (keep last 100 per user)
notificationSchema.statics.cleanupOldNotifications = async function(recipientId) {
  const notifications = await this.find({ recipientId })
    .sort({ createdAt: -1 })
    .skip(100)
    .select('_id');
  
  if (notifications.length > 0) {
    const ids = notifications.map(n => n._id);
    await this.deleteMany({ _id: { $in: ids } });
  }
};

module.exports = mongoose.model('Notification', notificationSchema);