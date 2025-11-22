const verifyServiceAuth = (req, res, next) => {
  const serviceSecret = req.headers['x-service-secret'];
  
  if (serviceSecret !== process.env.PAYMENT_SERVICE_SECRET) {
    return res.status(403).json({
      message: 'Direct access not allowed'
    });
  }
  
  next();
};