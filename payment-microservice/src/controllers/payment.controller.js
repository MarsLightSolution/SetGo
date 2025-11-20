const azericardService = require('../services/azericard.service');
const transactionService = require('../services/transaction.service');
const cryptoService = require('../services/crypto.service');
const logger = require('../utils/logger');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/response.formatter');

class PaymentController {
  /**
   * Initiate payment
   */
  async initiatePayment(req, res) {
    try {
      const { amount, currency, description, email, metadata } = req.body;
      const userId = req.user.id; // From auth middleware
      
      // Generate unique order ID
      const orderId = cryptoService.generateOrderId();
      
      // Create transaction record
      const transaction = await transactionService.createTransaction({
        orderId,
        userId,
        amount,
        currency: currency || 'AZN',
        description,
        email,
        metadata,
        status: 'pending',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Create payment with Azericard
      const backUrl = `${process.env.APP_URL}/payment/callback`;
      
      const paymentResult = await azericardService.createPayment({
        amount,
        currency: currency || 'AZN',
        orderId,
        description,
        email,
        backUrl,
        metadata,
      });

      // Update transaction with redirect URL
      await transactionService.updateTransactionStatus(orderId, {
        transactionId: paymentResult.transactionId,
      });

      logger.info('Payment initiated successfully', { orderId, userId });

      return res.status(200).json(
        formatSuccessResponse({
          orderId,
          transactionId: paymentResult.transactionId,
          redirectUrl: paymentResult.redirectUrl,
          amount,
          currency: currency || 'AZN',
        })
      );
    } catch (error) {
      logger.error('Payment initiation error:', error);
      return res.status(500).json(
        formatErrorResponse('Payment initiation failed', error.message)
      );
    }
  }

  /**
   * Handle payment callback from Azericard
   */
  async handleCallback(req, res) {
    try {
      const callbackData = req.body;
      
      logger.info('Received payment callback', { data: callbackData });

      // Verify callback authenticity
      const verification = azericardService.verifyCallback(callbackData);
      
      if (!verification.valid) {
        logger.error('Invalid callback signature');
        return res.status(400).send('Invalid signature');
      }

      const { orderId, status, amount, transactionId, responseCode, responseMessage } = verification;

      // Update transaction
      const updateData = {
        status: status === '0' ? 'authorized' : 'failed',
        transactionId,
        rrn: callbackData.RRN,
        responseCode,
        responseMessage,
        webhookReceived: true,
      };

      if (status === '0') {
        updateData.authorizedAt = new Date();
      } else {
        updateData.failedAt = new Date();
        updateData.errorCode = responseCode;
        updateData.errorMessage = responseMessage;
      }

      await transactionService.updateTransactionStatus(orderId, updateData);

      logger.info('Payment callback processed', { orderId, status });

      // Redirect user to success/failure page
      const redirectUrl = status === '0' 
        ? `${process.env.APP_URL}/payment/success?orderId=${orderId}`
        : `${process.env.APP_URL}/payment/failure?orderId=${orderId}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Callback handling error:', error);
      return res.status(500).send('Callback processing failed');
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const transaction = await transactionService.getTransaction(orderId);

      if (!transaction) {
        return res.status(404).json(
          formatErrorResponse('Transaction not found')
        );
      }

      // Verify user owns this transaction
      if (transaction.userId !== userId) {
        return res.status(403).json(
          formatErrorResponse('Unauthorized access')
        );
      }

      return res.status(200).json(
        formatSuccessResponse({
          orderId: transaction.orderId,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          transactionId: transaction.transactionId,
          createdAt: transaction.createdAt,
        })
      );
    } catch (error) {
      logger.error('Get payment status error:', error);
      return res.status(500).json(
        formatErrorResponse('Failed to get payment status', error.message)
      );
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(req, res) {
    try {
      const { orderId } = req.params;
      const { amount, reason } = req.body;
      const userId = req.user.id;

      const transaction = await transactionService.getTransaction(orderId);

      if (!transaction) {
        return res.status(404).json(
          formatErrorResponse('Transaction not found')
        );
      }

      if (transaction.userId !== userId) {
        return res.status(403).json(
          formatErrorResponse('Unauthorized access')
        );
      }

      if (transaction.status !== 'authorized' && transaction.status !== 'captured') {
        return res.status(400).json(
          formatErrorResponse('Transaction cannot be refunded')
        );
      }

      // Process refund with Azericard
      const refundResult = await azericardService.refundPayment({
        orderId,
        amount: amount || transaction.amount,
        reason,
      });

      // Update transaction
      await transactionService.updateTransactionStatus(orderId, {
        status: 'refunded',
        refundAmount: amount || transaction.amount,
        refundedAt: new Date(),
        refundReason: reason,
      });

      logger.info('Refund processed successfully', { orderId, amount });

      return res.status(200).json(
        formatSuccessResponse({
          orderId,
          refundId: refundResult.refundId,
          amount: amount || transaction.amount,
          message: 'Refund processed successfully',
        })
      );
    } catch (error) {
      logger.error('Refund processing error:', error);
      return res.status(500).json(
        formatErrorResponse('Refund failed', error.message)
      );
    }
  }

  /**
   * Get user payment history
   */
  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit, skip, status } = req.query;

      const result = await transactionService.getUserTransactions(userId, {
        limit: parseInt(limit) || 50,
        skip: parseInt(skip) || 0,
        status,
      });

      return res.status(200).json(
        formatSuccessResponse({
          transactions: result.transactions,
          total: result.total,
          limit: parseInt(limit) || 50,
          skip: parseInt(skip) || 0,
        })
      );
    } catch (error) {
      logger.error('Get payment history error:', error);
      return res.status(500).json(
        formatErrorResponse('Failed to get payment history', error.message)
      );
    }
  }
}

module.exports = new PaymentController();