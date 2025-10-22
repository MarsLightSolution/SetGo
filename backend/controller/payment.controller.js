cdconst paymentService = require('../services/paymentService');
const logger = require('../utils/logger'); // Import the logger

// Controller to initiate payment
exports.createPayment = async (req, res) => {
  const { userId, receiverId, amount, source, product } = req.body;
  logger.info(`[CreatePayment] Request received for userId: ${userId}, amount: ${amount}, product: ${product?.id || 'N/A'}`);

  try {
    // Input validation
    if (!userId || !amount || !product) {
      logger.warn(`[CreatePayment] Validation failed for userId: ${userId}. Missing required fields.`);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, amount, or product',
      });
    }

    // Call service to get payment URL
    const paymentUrl = await paymentService.createPayment(userId, receiverId, amount, product, source);

    logger.info(`[CreatePayment] Payment URL created successfully for userId: ${userId}`);

    return res.status(200).json({
      success: true,
      url: paymentUrl,
    });
  } catch (err) {
    logger.error(`[CreatePayment] Error creating payment for userId ${userId}: ${err.stack}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
    });
  }
};

// Controller to handle Paymentwall pingback
exports.handlePingback = async (req, res) => {
  // It's useful to log a unique identifier from the pingback if available, e.g., a transaction ID
  const pingbackId = req.query.uid || req.body.uid || 'N/A';
  logger.info(`[HandlePingback] Pingback received with ID: ${pingbackId}`);

  try {
    const result = await paymentService.handlePingback(req);
    logger.info(`[HandlePingback] Pingback processed for ID ${pingbackId}. Result: ${result}`);
    return res.status(200).send(result); // Should be 'OK' or an error message
  } catch (err) {
    logger.error(`[HandlePingback] Error processing pingback for ID ${pingbackId}: ${err.stack}`);
    return res.status(400).send('Error processing pingback');
  }
};
