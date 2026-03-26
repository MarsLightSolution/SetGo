const Concern = require("../models/concern");
const Order = require("../models/Order");
const User = require("../models/user"); // ✅ Make sure you have User model to fetch email
const winston = require("winston");
const nodemailer = require("nodemailer");
const { emitToUser } = require('../utils/ioInstance');

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

// ========= Mail Transporter (for future use) =========
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER, // your Gmail address
    pass: process.env.MAIL_PASS, // app password (not your main password)
  },
});

// ========= Helper function for sending mail (for future use) =========
async function sendMail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: `"SetGo Support" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
    });
    logger.info(`Email sent successfully to ${to}`);
  } catch (err) {
    logger.error(`Failed to send email: ${err.message}`);
  }
}

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

    if (!userId) {
      logger.warn(`${endpoint}: Missing userId`, { body: req.body });
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    if (issueType === "order_issue" && !orderId) {
      logger.warn(`${endpoint}: Missing orderId for order_issue`, { userId });
      return res
        .status(400)
        .json({ success: false, message: "Order ID is required for order issues" });
    }

    if (issueType === "payment_issue" && !transactionId) {
      logger.warn(`${endpoint}: Missing transactionId for payment_issue`, {
        userId,
      });
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required for payment issues",
      });
    }

    // ✅ ADD THIS - Process uploaded images from multer
const imagesRaw = Array.isArray(req.files?.images)
  ? req.files.images
  : req.files?.images
  ? [req.files.images]
  : [];

if (imagesRaw.length > 3) {
  logger.warn(`${endpoint}: Too many images`, { imageCount: imagesRaw.length });
  return res.status(400).json({
    success: false,
    message: "Maximum 3 images allowed",
  });
}

// Convert file paths to proper format
const processedImages = imagesRaw.map(f => f.path.replace(/\\/g, "/"));

logger.info(`${endpoint}: Images processed`, {
  count: processedImages.length,
  paths: processedImages,
});

    const concern = await Concern.create({
      userId,
      issueType,
      orderId: orderId || null,
      transactionId: transactionId || null,
      walletId: walletId || null,
      sellerId: sellerId || null,
      adId: adId || null,
      message,
      images: processedImages,  // ✅ CORRECT - Use the processed images from multer
      metadata: {
        userAgent: req.headers["user-agent"] || "unknown",
        ipAddress: req.ip || "N/A",
      },
    });

    logger.info(`${endpoint}: Concern created successfully`, {
      concernId: concern._id,
      userId,
      issueType,
      imageCount: processedImages.length,
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
    logger.error(`${endpoint}: ${error.message}`, {
      stack: error.stack,
      body: req.body,
    });
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
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const concerns = await Concern.find({ userId })
      .populate("orderId", "transactionId status total")
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 });

    logger.info(`${endpoint}: Retrieved user concerns`, {
      userId,
      count: concerns.length,
    });

    res.status(200).json({
      success: true,
      count: concerns.length,
      concerns: concerns.map((c) => ({
        concernId: c._id,
        issueType: c.issueType,
        status: c.status,
        message:
          c.message.substring(0, 80) + (c.message.length > 80 ? "..." : ""),
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

    // If userId provided, filter by it (user view); otherwise allow admin access
    const query = userId ? { _id: concernId, userId } : { _id: concernId };

    const concern = await Concern.findOne(query)
      .populate("orderId")
      .populate("sellerId", "name email")
      .populate("adminResponses.adminId", "name");

    if (!concern) {
      logger.warn(`${endpoint}: Concern not found`, { concernId, userId });
      return res
        .status(404)
        .json({ success: false, message: "Concern not found" });
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

    if (!message) {
      logger.warn(`${endpoint}: Missing message`, { concernId });
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }

    if (!adminId) {
      logger.warn(`${endpoint}: Missing adminId`, { concernId });
      return res
        .status(400)
        .json({ success: false, message: "Admin ID is required" });
    }

    const concern = await Concern.findById(concernId).populate("userId", "email name");
    if (!concern) {
      logger.warn(`${endpoint}: Concern not found`, { concernId });
      return res
        .status(404)
        .json({ success: false, message: "Concern not found" });
    }

    concern.adminResponses.push({ adminId, message, respondedAt: new Date() });

    // Update status to in_progress if it's currently open
    if (concern.status === "open") {
      concern.status = "in_progress";
    }

    await concern.save();

    // ── Real-time notification to the user who raised the concern ─────────
    emitToUser(String(concern.userId._id || concern.userId), "notification", {
      id:        `concern_reply_${concernId}_${Date.now()}`,
      type:      "system",
      title:     "💬 Support Team Replied",
      message:   `Your query regarding "${concern.issueType.replace(/_/g, " ")}" has a new response.`,
      timestamp: Date.now(),
      isRead:    false,
      concernId,
    });

    // ✉️ UNCOMMENT BELOW TO ENABLE EMAIL NOTIFICATION
    /*
    const userEmail = concern.userId.email;
    if (userEmail) {
      await sendMail(
        userEmail,
        "Admin Response to Your Concern",
        `Dear ${concern.userId.name || "User"},\n\nAdmin has replied to your concern:\n\n"${message}"\n\nConcern ID: ${concernId}\nIssue Type: ${concern.issueType}\n\nRegards,\nSetGo Support`
      );
    }
    */

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

    const updateData = { status };
    
    // Add timestamp for resolved/closed status
    if (status === "resolved") {
      updateData.resolvedAt = new Date();
    }
    if (status === "closed") {
      updateData.closedAt = new Date();
    }

    const concern = await Concern.findByIdAndUpdate(
      concernId,
      updateData,
      { new: true }
    );

    if (!concern) {
      logger.warn(`${endpoint}: Concern not found to update`, { concernId });
      return res
        .status(404)
        .json({ success: false, message: "Concern not found" });
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

    logger.info(`${endpoint}: Fetched all concerns`, {
      count: concerns.length,
      filter,
    });

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

// ========= NEW: Close Concern with Admin Message =========
// This API is triggered when admin clicks close button
// Popup will contain the admin message which gets sent here
exports.closeConcernWithMessage = async (req, res) => {
  const endpoint = "closeConcernWithMessage";
  try {
    const { concernId } = req.params;
    const { adminMessage, adminId } = req.body;

    if (!adminMessage || adminMessage.trim() === "") {
      logger.warn(`${endpoint}: Missing admin message`, { concernId });
      return res.status(400).json({
        success: false,
        message: "Admin message is required to close the concern",
      });
    }

    const concern = await Concern.findById(concernId).populate("userId", "email name");
    
    if (!concern) {
      logger.warn(`${endpoint}: Concern not found`, { concernId });
      return res
        .status(404)
        .json({ success: false, message: "Concern not found" });
    }

    // Check if already closed
    if (concern.status === "closed") {
      logger.warn(`${endpoint}: Concern already closed`, { concernId });
      return res.status(400).json({
        success: false,
        message: "Concern is already closed",
      });
    }

    // Add admin response
    concern.adminResponses.push({
      adminId: adminId || null,
      message: adminMessage,
      respondedAt: new Date(),
    });

    // Update status to closed
    concern.status = "closed";
    concern.closedAt = new Date();

    await concern.save();

    // ── Real-time notification to user ────────────────────────────────────
    emitToUser(String(concern.userId?._id || concern.userId), "notification", {
      id:        `concern_closed_${concernId}`,
      type:      "system",
      title:     "✅ Support Query Closed",
      message:   `Your query regarding "${concern.issueType.replace(/_/g, " ")}" has been resolved and closed.`,
      timestamp: Date.now(),
      isRead:    false,
      concernId,
    });

    // ✉️ UNCOMMENT BELOW TO ENABLE EMAIL NOTIFICATION
    /*
    const userEmail = concern.userId?.email;
    if (userEmail) {
      await sendMail(
        userEmail,
        "Your Concern Has Been Closed - SetGo Support",
        `Dear ${concern.userId.name || "User"},\n\nYour concern regarding "${concern.issueType}" has been closed by our support team.\n\n📝 Admin's Final Message:\n"${adminMessage}"\n\n🆔 Concern ID: ${concernId}\n📅 Closed At: ${new Date().toLocaleString()}\n\nIf you have any further questions, please don't hesitate to raise a new concern.\n\nThank you for your patience,\nSetGo Support Team`
      );
      logger.info(`${endpoint}: Closure email sent to ${userEmail}`);
    }
    */

    logger.info(`${endpoint}: Concern closed successfully`, {
      concernId,
      adminId,
      closedAt: concern.closedAt,
    });

    res.status(200).json({
      success: true,
      message: "Concern closed successfully",
      data: {
        concernId: concern._id,
        status: concern.status,
        closedAt: concern.closedAt,
        adminMessage: adminMessage,
        userEmail: concern.userId?.email,
        userName: concern.userId?.name,
      },
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, {
      stack: error.stack,
      concernId: req.params.concernId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to close concern",
      error: error.message,
    });
  }
};

// ========= Reopen Concern (Optional - if needed) =========
exports.reopenConcern = async (req, res) => {
  const endpoint = "reopenConcern";
  try {
    const { concernId } = req.params;
    const { reason } = req.body;

    const concern = await Concern.findById(concernId);
    
    if (!concern) {
      logger.warn(`${endpoint}: Concern not found`, { concernId });
      return res
        .status(404)
        .json({ success: false, message: "Concern not found" });
    }

    if (concern.status !== "closed") {
      logger.warn(`${endpoint}: Concern is not closed`, { concernId, currentStatus: concern.status });
      return res.status(400).json({
        success: false,
        message: "Only closed concerns can be reopened",
      });
    }

    // Reopen the concern
    concern.status = "open";
    concern.closedAt = null;
    
    // Add a note about reopening
    if (reason) {
      concern.adminResponses.push({
        adminId: null,
        message: `Concern reopened. Reason: ${reason}`,
        respondedAt: new Date(),
      });
    }

    await concern.save();

    logger.info(`${endpoint}: Concern reopened`, { concernId });

    res.status(200).json({
      success: true,
      message: "Concern reopened successfully",
      data: concern,
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to reopen concern",
      error: error.message,
    });
  }
};

// ========= Get Concern Statistics (Admin Dashboard) =========
exports.getConcernStatistics = async (req, res) => {
  const endpoint = "getConcernStatistics";
  try {
    const totalConcerns = await Concern.countDocuments();
    const openConcerns = await Concern.countDocuments({ status: "open" });
    const inProgressConcerns = await Concern.countDocuments({ status: "in_progress" });
    const resolvedConcerns = await Concern.countDocuments({ status: "resolved" });
    const closedConcerns = await Concern.countDocuments({ status: "closed" });

    // Get concerns by issue type
    const concernsByType = await Concern.aggregate([
      {
        $group: {
          _id: "$issueType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent concerns (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentConcerns = await Concern.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    logger.info(`${endpoint}: Statistics retrieved successfully`);

    res.status(200).json({
      success: true,
      statistics: {
        total: totalConcerns,
        byStatus: {
          open: openConcerns,
          in_progress: inProgressConcerns,
          resolved: resolvedConcerns,
          closed: closedConcerns,
        },
        byIssueType: concernsByType,
        recentConcerns: {
          last7Days: recentConcerns,
        },
      },
    });
  } catch (error) {
    logger.error(`${endpoint}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch concern statistics",
      error: error.message,
    });
  }
};