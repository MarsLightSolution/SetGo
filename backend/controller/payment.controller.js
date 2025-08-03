const paymentService = require('../services/paymentService');

// Controller to initiate payment
exports.createPayment = async (req, res) => {
  try {
    const { userId,receiverId, amount, source, product } = req.body;

    // Input validation
    if (!userId || !amount || !product) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, amount, or product',
      });
    }

    // Call service to get payment URL
    const paymentUrl = await paymentService.createPayment(userId,receiverId, amount, product, source);

    console.log('✅ Payment URL:', paymentUrl);

    return res.status(200).json({
      success: true,
      url: paymentUrl,
    });
  } catch (err) {
    console.error('❌ Error in createPayment:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
    });
  }
};

// Controller to handle Paymentwall pingback
exports.handlePingback = async (req, res) => {
  try {
    const result = await paymentService.handlePingback(req);
    return res.status(200).send(result); // Should be 'OK' or 'Invalid pingback'
  } catch (err) {
    console.error(' Error in handlePingback:', err.message);
    return res.status(400).send('Error processing pingback');
  }
};
