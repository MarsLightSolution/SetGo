// /api/v2 admin-only handlers (the routes add verifyJWT + adminOnly). They do what the inline
// handlers in logRoutes / notificationRoutes / redisRoutes do; those files are unchanged.
const fs = require("fs");
const path = require("path");
const Notification = require("../../models/Notification");
const redisClient = require("../../utils/redisClient");
const ApiResponse = require("../../utils/ApiResponse");
const logger = require("../../utils/logger");

const ERROR_LOG_PATH = path.join(__dirname, "../../logs/error.log");

// GET /api/v2/logs/error?lines=&since=
exports.readErrorLogFile = async (req, res, next) => {
  try {
    if (!fs.existsSync(ERROR_LOG_PATH)) {
      return res.status(200).json(new ApiResponse(200, { entries: [] }, "No error log found"));
    }
    const maxLines = Math.min(parseInt(req.query.lines, 10) || 100, 1000);
    const since = req.query.since ? new Date(req.query.since) : null;
    const lines = fs.readFileSync(ERROR_LOG_PATH, "utf-8").trim().split("\n").filter(Boolean);
    const entries = lines
      .slice(-maxLines)
      .map((line) => {
        const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\]: (.+)$/);
        return match ? { timestamp: match[1], level: match[2], message: match[3] } : { raw: line };
      })
      .filter((entry) => !since || !entry.timestamp || new Date(entry.timestamp) >= since);
    return res.status(200).json(new ApiResponse(200, { total: entries.length, entries }, "Error logs fetched"));
  } catch (err) {
    return next(err);
  }
};

// POST /api/v2/notifications
exports.createNotification = async (req, res) => {
  try {
    const { recipientId, type, title, message, metadata } = req.body || {};
    if (!recipientId || !type || !title) {
      return res.status(400).json({ success: false, message: "Missing required fields: recipientId, type, title" });
    }
    const notification = await Notification.createNotification({
      recipientId, senderId: String(req.user._id), type, title, message, metadata,
    });
    return res.status(201).json({ success: true, message: "Notification created successfully", data: notification });
  } catch (error) {
    logger.error("[v2 createNotification] failed", { message: error.message });
    return res.status(500).json({ success: false, message: "Failed to create notification" });
  }
};

// GET /api/v2/redis/clear-cache
exports.clearCache = async (req, res) => {
  try {
    await redisClient.del("userList");
    return res.send({ message: "✅ Redis cache cleared successfully!" });
  } catch (err) {
    logger.error("[v2 clearCache] failed", { message: err.message });
    return res.status(500).send({ error: "Error clearing cache" });
  }
};
