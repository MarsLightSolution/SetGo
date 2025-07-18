const Paymentwall = require('paymentwall');

Paymentwall.Configure(
  Paymentwall.Base.API_GOODS,
  'be2b2a35356b78cbf499cdac649363e2',
  '57c1c499c2d85db6b1ac8bfe71a009ca'
);


const initiatePayment = async (userId, amount) => {
  const widget = new Paymentwall.Widget(
    userId,
    'p1_1',
    [
      new Paymentwall.Product('productId', amount, 'USD', 'Wallet Recharge', Paymentwall.Product.TYPE_FIXED)
    ],
    { email: 'user@example.com' }
  );
  return widget.getUrl();
};

const handlePingback = async (req) => {
  const pingback = new Paymentwall.Pingback(req.query, req.ip);

  if (pingback.validate()) {
    return 'OK';
  } else {
    return 'Invalid pingback';
  }
};

// ✅ Correct export
module.exports = {
  initiatePayment,
  handlePingback
};