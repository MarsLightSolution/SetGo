// controllers/concernController.js
const Concern = require("../models/concern");
const Order = require("../models/order");
const winston = require("winston");

// ========= Winston Logger Setup =========
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// ========= Raise a new concern =========
exports.raiseConcern = async (req, res) => {
  const endpoint = "raiseConcern";
  const startTime = Date.now();

  try {
    const {
      userId,
      issueType,
      orderId,
      transactionId,
      walletId,
      sellerId,
      adId,
      message,
      images,
    } = req.body;

    // Input Validation
    if (!userId) {
      logger.warn(`${endpoint}: Missing userId`, { body: req.body });
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    if (issueType === "order_issue" && !orderId) {
      logger.warn(`${endpoint}: Missing orderId for order_issue`, { userId });
      return res.status(400).json({ success: false, message: "Order ID is required for order issues" });
    }

    if (issueType === "payment_issue" && !transactionId) {
      logger.warn(`${endpoint}: Missing transactionId for payment_issue`, { userId });
      return res.status(400).json({ success: false, message: "Transaction ID is required for payment issues" });
    }

    if (images && images.length > 3) {
      logger.warn(`${endpoint}: Too many images`, { imageCount: images.length });
      return res.status(400).json({ success: false, message: "Maximum 3 images allowed" });
    }

    // Create concern
    const concern = await Concern.create({
      userId,
      issueType,
      orderId: orderId || null,
      transactionId: transactionId || null,
      walletId: walletId || null,
      sellerId: sellerId || null,
      adId: adId || null,
      message,
      images: images || [],
      metadata: {
        userAgent: req.headers["user-agent"] || "unknown",
        ipAddress: req.ip || "N/A",
      },
    });

    logger.info(`${endpoint}: Concern created successfully`, {
      concernId: concern._id,
      userId,
      issueType,
      duration: Date.now() - startTime + "ms",
    });

    res.status(201).json({
      success: true,
      concernId: concern._id,
      message: "Concern raised successfully. We'll respond within 24–48 hours.",
      estimatedResolutionTime: "48 hours",
      data: concern,
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack, body: req.body });
    res.status(500).json({
      success: false,
      message: "Failed to raise concern. Please provide Valid ID.",
      error: error.message,
    });
  }
};

// ========= Get all concerns for a user =========
exports.getUserConcerns = async (req, res) => {
  const endpoint = "getUserConcerns";
  try {
    const { userId } = req.query;
    if (!userId) {
      logger.warn(`${endpoint}: Missing userId`, { query: req.query });
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const concerns = await Concern.find({ userId })
      .populate("orderId", "transactionId status total")
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 });

    logger.info(`${endpoint}: Retrieved user concerns`, { userId, count: concerns.length });

    res.status(200).json({
      success: true,
      count: concerns.length,
      concerns: concerns.map((c) => ({
        concernId: c._id,
        issueType: c.issueType,
        status: c.status,
        message: c.message.substring(0, 80) + (c.message.length > 80 ? "..." : ""),
        createdAt: c.createdAt,
        lastUpdated: c.updatedAt,
      })),
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch concerns.",
      error: error.message,
    });
  }
};

// ========= Get concern details =========
exports.getConcernDetails = async (req, res) => {
  const endpoint = "getConcernDetails";
  try {
    const { concernId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      logger.warn(`${endpoint}: Missing userId`, { params: req.params });
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const concern = await Concern.findOne({ _id: concernId, userId })
      .populate("orderId")
      .populate("sellerId", "name email")
      .populate("adminResponses.adminId", "name");

    if (!concern) {
      logger.warn(`${endpoint}: Concern not found`, { concernId, userId });
      return res.status(404).json({ success: false, message: "Concern not found" });
    }

    logger.info(`${endpoint}: Concern details retrieved`, { concernId, userId });

    res.status(200).json({ success: true, data: concern });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch concern details",
      error: error.message,
    });
  }
};

// ========= Admin: Add response =========
exports.addAdminResponse = async (req, res) => {
  const endpoint = "addAdminResponse";
  try {
    const { concernId } = req.params;
    const { message, adminId } = req.body;

    if (!adminId) {
      logger.warn(`${endpoint}: Missing adminId`, { concernId });
      return res.status(400).json({ success: false, message: "Admin ID is required" });
    }

    const concern = await Concern.findById(concernId);
    if (!concern) {
      logger.warn(`${endpoint}: Concern not found`, { concernId });
      return res.status(404).json({ success: false, message: "Concern not found" });
    }

    concern.adminResponses.push({ adminId, message, respondedAt: new Date() });
    concern.status = "in_progress";
    await concern.save();

    logger.info(`${endpoint}: Admin response added`, { concernId, adminId });

    res.status(200).json({
      success: true,
      message: "Response added successfully",
      data: concern,
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to add admin response",
      error: error.message,
    });
  }
};

// ========= Admin: Update status =========
exports.updateConcernStatus = async (req, res) => {
  const endpoint = "updateConcernStatus";
  try {
    const { concernId } = req.params;
    const { status } = req.body;
    const validStatuses = ["open", "in_progress", "resolved", "closed"];

    if (!validStatuses.includes(status)) {
      logger.warn(`${endpoint}: Invalid status`, { concernId, provided: status });
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const concern = await Concern.findByIdAndUpdate(
      concernId,
      { status, ...(status === "resolved" && { resolvedAt: new Date() }) },
      { new: true }
    );

    if (!concern) {
      logger.warn(`${endpoint}: Concern not found to update`, { concernId });
      return res.status(404).json({ success: false, message: "Concern not found" });
    }

    logger.info(`${endpoint}: Concern status updated`, { concernId, status });

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: concern,
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to update concern status",
      error: error.message,
    });
  }
};

// ========= Get all concerns (admin) =========
exports.getAllConcerns = async (req, res) => {
  const endpoint = "getAllConcerns";
  try {
    const { status, issueType, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (issueType) filter.issueType = issueType;

    const concerns = await Concern.find(filter)
      .populate("userId", "name email")
      .populate("orderId", "transactionId status")
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    logger.info(`${endpoint}: Fetched all concerns`, { count: concerns.length, filter });

    res.status(200).json({
      success: true,
      count: concerns.length,
      concerns,
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch all concerns",
      error: error.message,
    });
  }
};
