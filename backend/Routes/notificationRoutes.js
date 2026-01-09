const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middlewares/auth.middlewares'); // Using existing auth middleware
const logger = require('../utils/logger');

// Get all notifications for the authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.email || req.user._id; // Using _id from mongoose
    
    const query = { recipientId: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        },
        unreadCount
      }
    });
  } catch (error) {
    logger.error('Error fetching notifications', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.email || req.user._id;
    const unreadCount = await Notification.getUnreadCount(userId);
    
    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    logger.error('Error getting unread count', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
});

// Mark a specific notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.email || req.user._id;

    const notification = await Notification.findOne({
      _id: id,
      recipientId: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    logger.error('Error marking notification as read', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.email || req.user._id;
    const result = await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    logger.error('Error marking all notifications as read', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// Delete a specific notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.email || req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipientId: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting notification', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// Delete all read notifications
router.delete('/read/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.email || req.user._id;
    const result = await Notification.deleteMany({
      recipientId: userId,
      isRead: true
    });

    res.json({
      success: true,
      message: 'All read notifications deleted',
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    logger.error('Error deleting read notifications', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to delete read notifications',
      error: error.message
    });
  }
});

// Create a notification (for admin/system use)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { recipientId, type, title, message, metadata } = req.body;
    const senderId = req.user.email || req.user._id;

    if (!recipientId || !type || !title) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: recipientId, type, title'
      });
    }

    const notification = await Notification.createNotification({
      recipientId,
      senderId,
      type,
      title,
      message,
      metadata
    });

    // You can also emit via Socket.IO here if needed
    // This would require access to the io instance

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    logger.error('Error creating notification', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
});

module.exports = router;