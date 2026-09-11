const ErrorLog = require('../models/ErrorLog');
const logger = require('../utils/logger');

/**
 * POST /api/logs/error
 * Receives client-side error reports from the mobile app.
 * No auth required — errors can happen before/after login.
 */
const reportError = async (req, res) => {
  try {
    const {
      message,
      stack,
      type,
      module,
      extra,
      userId,
      platform,
      appVersion,
      osVersion,
      device,
    } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    await ErrorLog.create({
      message: String(message).slice(0, 2000),
      stack: stack ? String(stack).slice(0, 5000) : undefined,
      type: type || 'uncaught',
      module,
      extra,
      userId,
      platform,
      appVersion,
      osVersion,
      device,
    });

    return res.status(201).json({ success: true });
  } catch (err) {
    logger.error('Failed to save error log', err);
    return res.status(500).json({ success: false });
  }
};

/**
 * GET /api/logs/error
 * Returns recent unresolved error logs (admin only).
 */
const getErrors = async (req, res) => {
  try {
    const { resolved = 'false', limit = 50, page = 1 } = req.query;
    const filter = { resolved: resolved === 'true' };

    const [logs, total] = await Promise.all([
      ErrorLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      ErrorLog.countDocuments(filter),
    ]);

    return res.json({ success: true, data: logs, total, page: Number(page) });
  } catch (err) {
    logger.error('Failed to fetch error logs', err);
    return res.status(500).json({ success: false });
  }
};

/**
 * PATCH /api/logs/error/:id/resolve
 * Marks an error log as resolved (admin only).
 */
const resolveError = async (req, res) => {
  try {
    await ErrorLog.findByIdAndUpdate(req.params.id, { resolved: true });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

module.exports = { reportError, getErrors, resolveError };
