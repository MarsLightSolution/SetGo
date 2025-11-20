const Transaction = require('../models/transaction.model');
const logger = require('../utils/logger');

class TransactionService {
  async createTransaction(transactionData) {
    try {
      const transaction = new Transaction(transactionData);
      await transaction.save();
      logger.info('Transaction created', { orderId: transaction.orderId });
      return transaction;
    } catch (error) {
      logger.error('Transaction creation error:', error);
      throw error;
    }
  }

  async getTransaction(orderId) {
    try {
      return await Transaction.findOne({ orderId });
    } catch (error) {
      logger.error('Get transaction error:', error);
      throw error;
    }
  }

  async updateTransactionStatus(orderId, updateData) {
    try {
      const transaction = await Transaction.findOneAndUpdate(
        { orderId },
        { $set: updateData },
        { new: true }
      );
      
      logger.info('Transaction updated', { orderId, status: updateData.status });
      return transaction;
    } catch (error) {
      logger.error('Transaction update error:', error);
      throw error;
    }
  }

  async getUserTransactions(userId, options = {}) {
    try {
      const { limit = 50, skip = 0, status } = options;
      
      const query = { userId };
      if (status) query.status = status;

      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Transaction.countDocuments(query);

      return { transactions, total };
    } catch (error) {
      logger.error('Get user transactions error:', error);
      throw error;
    }
  }

  async getTransactionStats(userId) {
    try {
      const stats = await Transaction.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]);

      return stats;
    } catch (error) {
      logger.error('Get transaction stats error:', error);
      throw error;
    }
  }
}

module.exports = new TransactionService();