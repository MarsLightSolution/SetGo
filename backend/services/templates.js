// emails/templates.js

const baseStyles = `
  font-family: Arial, sans-serif; 
  background-color: #f9f9f9; 
  padding: 20px;
  color: #333;
`;

const cardStyles = `
  background: #ffffff; 
  padding: 20px; 
  border-radius: 10px; 
  box-shadow: 0 2px 6px rgba(0,0,0,0.1); 
  margin-top: 15px;
`;

const buttonStyles = `
  display: inline-block; 
  margin-top: 15px; 
  padding: 10px 20px; 
  background-color: #4CAF50; 
  color: #ffffff; 
  text-decoration: none; 
  border-radius: 5px;
`;

function wrapper(content) {
  return `
    <html>
      <body style="${baseStyles}">
        <div style="max-width:600px; margin:auto;">
          <h1 style="color:#4CAF50; text-align:center;">YourShop</h1>
          <div style="${cardStyles}">
            ${content}
          </div>
          <p style="text-align:center; font-size:12px; color:#888; margin-top:20px;">
            © ${new Date().getFullYear()} YourShop. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;
}

// Buyer Payment Email
function buyerPaymentTemplate(buyer, order, seller) {
  return wrapper(`
    <h2>Hi ${buyer.name}, 🎉</h2>
    <p>Thank you for your payment! Your order has been successfully placed.</p>
    <ul>
      <li><strong>Order ID:</strong> ${order.id}</li>
      <li><strong>Product:</strong> ${order.product}</li>
      <li><strong>Amount Paid:</strong> ₹${order.amount}</li>
    </ul>
    <p>Your seller is: <strong>${seller.name}</strong>. They’ll update tracking soon.</p>
    <a href="#" style="${buttonStyles}">View My Order</a>
  `);
}

// Seller Payment Email
function sellerPaymentTemplate(seller, order, buyer) {
  return wrapper(`
    <h2>Hi ${seller.name}, 🛒</h2>
    <p>Great news! You’ve received a new order.</p>
    <ul>
      <li><strong>Order ID:</strong> ${order.id}</li>
      <li><strong>Product:</strong> ${order.product}</li>
      <li><strong>Amount:</strong> ₹${order.amount}</li>
    </ul>
    <p>Buyer details: <strong>${buyer.name}</strong> (${buyer.email})</p>
    <a href="#" style="${buttonStyles}">Manage Order</a>
  `);
}

// Admin Payment Email
function adminPaymentTemplate(admin, order, buyer, seller) {
  return wrapper(`
    <h2>Hello Admin, ⚡</h2>
    <p>A new order has just been placed.</p>
    <ul>
      <li><strong>Order ID:</strong> ${order.id}</li>
      <li><strong>Product:</strong> ${order.product}</li>
      <li><strong>Amount:</strong> ₹${order.amount}</li>
    </ul>
    <p><strong>Buyer:</strong> ${buyer.name} (${buyer.email})</p>
    <p><strong>Seller:</strong> ${seller.name} (${seller.email})</p>
    <a href="#" style="${buttonStyles}">Review Order</a>
  `);
}

// Tracking Update Email
function trackingUpdateTemplate(user, order, trackingId) {
  return wrapper(`
    <h2>Hi ${user.name}, 🚚</h2>
    <p>Your order tracking information has been updated.</p>
    <ul>
      <li><strong>Order ID:</strong> ${order.id}</li>
      <li><strong>Product:</strong> ${order.productId.title?.en}</li>
      <li><strong>Tracking ID:</strong> ${trackingId}</li>
    </ul>
    <a href="https://tracking.example.com/${trackingId}" style="${buttonStyles}">Track My Order</a>
  `);
}

// Order Rejected Email
function orderRejectedTemplate(user, order, reason) {
  return wrapper(`
    <h2>Hi ${user.username}, ❌</h2>
    <p>We’re sorry, but your order has been <strong>rejected</strong>.</p>
    <ul>
      <li><strong>Order ID:</strong> ${order.id}</li>
      <li><strong>Product:</strong> ${order.product}</li>
    </ul>
    <p><strong>Reason:</strong> ${reason || "Not specified by the seller."}</p>
    <p>If you have already paid, a refund will be processed shortly.</p>
    <a href="#" style="${buttonStyles}">Contact Support</a>
  `);
}

// Item Received Email
function itemReceivedTemplate(user, order) {
  return wrapper(`
    <h2>Hi ${user.name}, ✅</h2>
    <p>The buyer has confirmed that the item has been received.</p>
    <ul>
      <li><strong>Order ID:</strong> ${order.id}</li>
      <li><strong>Product:</strong> ${order.product}</li>
    </ul>
    <p>Funds will be released soon as per admin confirmation.</p>
    <a href="#" style="${buttonStyles}">Check Balance</a>
  `);
}

// Funds Released Email
function fundsReleasedTemplate(user, order, action) {
  let message = "";

  if (action === "seller") {
    message = `
      <p>🎉 Congratulations! Funds have been released to your account.</p>
      <ul>
        <li><strong>Order ID:</strong> ${order.id}</li>
        <li><strong>Product:</strong> ${order.product}</li>
        <li><strong>Amount Released:</strong> ₹${order.amount}</li>
      </ul>
      <p>You should see the funds in your account shortly.</p>
    `;
  } else if (action === "buyer") {
    message = `
      <p>💸 Your order has been cancelled and a refund has been initiated.</p>
      <ul>
        <li><strong>Order ID:</strong> ${order.id}</li>
        <li><strong>Product:</strong> ${order.product}</li>
        <li><strong>Refund Amount:</strong> ₹${order.amount}</li>
      </ul>
      <p>The refunded amount should reflect in your account within 5–7 business days.</p>
    `;
  }

  return wrapper(`
    <h2>Hi ${user.username},</h2>
    ${message}
    <a href="#" style="${buttonStyles}">View Transaction</a>
  `);
}

module.exports = {
  buyerPaymentTemplate,
  sellerPaymentTemplate,
  adminPaymentTemplate,
  trackingUpdateTemplate,
  orderRejectedTemplate,
  itemReceivedTemplate,
  fundsReleasedTemplate
};
