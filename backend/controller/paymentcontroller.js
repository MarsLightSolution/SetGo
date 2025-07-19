const paymentService = require('../services/paymentService');

exports.createPayment = async (req, res) => {
  try {
    const { userId, amount,source,product } = req.body;
    const paymentUrl = await paymentService.initiatePayment(userId, amount,product,source);
    console.log(paymentUrl);
    
    res.json({ success: true, url: paymentUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Payment failed' });
  }
};

exports.handlePingback = async (req, res) => {
  try {
    const result = await paymentService.handlePingback(req);
    res.send(result); // Should return 'OK' or 'Invalid pingback'
  } catch (err) {
    res.status(400).send('Error in pingback');
  }
};
