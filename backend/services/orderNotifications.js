const { sendEmail } = require('./emailService');
const { buyerPaymentTemplate, sellerPaymentTemplate } = require('./templates');
const { emitToUser } = require('../utils/ioInstance');
const Notification = require('../models/Notification');
const User = require('../models/user');
const Product = require('../models/product.model');
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

// ---------------------------------------------------------------------------------------------
// Every later order event: saved in-app notification + live socket push + email, to the buyer
// and/or seller. Never throws: a failed notification must not undo a payment or refund.

const amount = (n) => `${Number(n || 0).toFixed(2)} AZN`;

// Each event: who hears about it, and what they are told. `o` = order, `p` = product name,
// `reason` = optional reason given by the admin or the bank.
const EVENTS = {
  payment_failed: {
    buyer: ({ o, p }) => ['Payment failed', `Your card payment of ${amount(o.onlineAmount || o.total)} for "${p}" was not completed. You have not been charged for this order. You can try again.`],
  },
  payment_review: {
    buyer: ({ o, p }) => ['Payment being confirmed', `We are confirming your payment of ${amount(o.onlineAmount || o.total)} for "${p}" with the bank. We will let you know as soon as it is settled.`],
  },
  order_cancelled: {
    buyer: ({ p, reason }) => ['Order cancelled', `Your order for "${p}" was cancelled by SATGO.${reason ? ` Reason: ${reason}.` : ''}`],
    seller: ({ p, reason }) => ['Order cancelled', `The order for "${p}" was cancelled by SATGO.${reason ? ` Reason: ${reason}.` : ''}`],
  },
  refund_started: {
    buyer: ({ o, p, reason }) => ['Refund started', `SATGO has started a refund of ${amount(o.total)} for "${p}".${reason ? ` Reason: ${reason}.` : ''} Card refunds usually reach your card within a few business days.`],
    seller: ({ o, p, reason }) => ['Order refunded', `SATGO is refunding the order for "${p}" (${amount(o.total)}) to the buyer.${reason ? ` Reason: ${reason}.` : ''}`],
  },
  refund_completed: {
    buyer: ({ o, p }) => ['Refund completed', `Your refund of ${amount(o.total)} for "${p}" is complete.${o.onlineAmount > 0 ? ' The card part has been returned to your card by the bank.' : ' It has been returned to your SATGO wallet.'}`],
    seller: ({ o, p }) => ['Refund completed', `The refund of ${amount(o.total)} for "${p}" is complete and has been taken from your SATGO wallet.`],
  },
  refund_failed: {
    buyer: ({ p }) => ['Refund delayed', `Your refund for "${p}" could not be completed automatically. Our team is handling it and will contact you.`],
  },
  delivery_approved: {
    buyer: ({ p }) => ['Delivery confirmed', `Delivery of "${p}" has been confirmed.`],
    seller: ({ p }) => ['Delivery confirmed', `Delivery of "${p}" has been confirmed by SATGO.`],
  },
  funds_released: {
    seller: ({ o, p }) => ['Funds released', `${amount(o.total)} for "${p}" has been released to you.`],
  },
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function emailHtml(name, title, message, orderId) {
  return `<html><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px;color:#333">
<div style="max-width:600px;margin:auto">
  <h1 style="color:#2e7d32;text-align:center">SATGO</h1>
  <div style="background:#fff;padding:20px;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,.1)">
    <h2 style="margin-top:0">${esc(title)}</h2>
    <p>Hi ${esc(name || 'there')},</p>
    <p>${esc(message)}</p>
    <p style="color:#888;font-size:13px">Order: ${esc(orderId)}</p>
  </div>
  <p style="text-align:center;font-size:12px;color:#888;margin-top:20px">© ${new Date().getFullYear()} SATGO</p>
</div></body></html>`;
}

async function send(userId, { title, message, orderId, event }) {
  if (!userId) return;
  const id = String(userId);
  const saved = await Notification.createNotification({
    recipientId: id, type: 'order', title, message, metadata: { orderId: String(orderId) },
  });
  emitToUser(id, 'notification', {
    id: String(saved._id), type: 'order', event, title, message, timestamp: Date.now(), isRead: false, orderId: String(orderId),
  });
  const user = await User.findById(id).select('email username profileName').lean();
  if (user?.email) {
    await sendEmail(user.email, `SATGO: ${title}`, emailHtml(user.profileName || user.username, title, message, orderId));
  }
}

async function notifyOrderEvent(order, event, { reason } = {}) {
  const spec = EVENTS[event];
  if (!spec || !order) return;
  try {
    let p = order.paymentMetadata?.productTitle;
    if (!p) {
      const product = await Product.findById(order.productId).select('title').lean();
      p = product?.title?.en || 'your item';
    }
    const ctx = { o: order, p, reason };
    for (const role of ['buyer', 'seller']) {
      if (!spec[role]) continue;
      const [title, message] = spec[role](ctx);
      try {
        await send(role === 'buyer' ? order.buyerId : order.sellerId, { title, message, orderId: order._id, event });
      } catch (err) {
        logger.error(`[Notify] ${event} to ${role} failed`, { orderId: String(order._id), message: err.message });
      }
    }
  } catch (err) {
    logger.error(`[Notify] ${event} failed`, { orderId: String(order?._id), message: err.message });
  }
}

module.exports = { notifyOrderPlaced, notifyOrderEvent, ORDER_EVENTS: Object.keys(EVENTS) };
