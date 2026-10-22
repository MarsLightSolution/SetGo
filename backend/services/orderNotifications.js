const { sendEmail } = require('./emailService');
const { buyerPaymentTemplate, sellerPaymentTemplate } = require('./templates');
const { emitToUser } = require('../utils/ioInstance');
const logger = require('../utils/logger');

// `product.owner` must be populated with username + email.
async function notifyOrderPlaced(order, product) {
  const productName = product.title?.en || product.title || 'item';
  const { name: buyerName, email: buyerEmail } = order.checkoutDetails;

  emitToUser(order.buyerId, 'notification', {
    id: `order_placed_buyer_${order._id}`,
    type: 'order',
    title: '🛒 Order Placed Successfully!',
    message: `Your order for "${productName}" has been confirmed. Amount: ${order.total} AZN`,
    timestamp: Date.now(),
    isRead: false,
    orderId: order._id,
  });

  emitToUser(order.sellerId, 'notification', {
    id: `order_placed_seller_${order._id}`,
    type: 'order',
    title: '🎉 New Order Received!',
    message: `${buyerName} ordered "${productName}". Amount: ${order.total} AZN`,
    timestamp: Date.now(),
    isRead: false,
    orderId: order._id,
  });

  const buyer = { id: order.buyerId, name: buyerName, email: buyerEmail };
  const seller = { id: order.sellerId, name: product.owner?.username, email: product.owner?.email };
  const summary = { id: order.transactionId, product: productName, amount: order.total };

  try {
    await sendEmail(buyer.email, 'New Order Received', buyerPaymentTemplate(buyer, summary, seller));
    if (seller.email) {
      await sendEmail(seller.email, 'New Order Notification', sellerPaymentTemplate(seller, summary, buyer));
    }
  } catch (mailErr) {
    logger.error('Order email sending failed', { orderId: order._id, message: mailErr.message });
  }
}

module.exports = { notifyOrderPlaced };
