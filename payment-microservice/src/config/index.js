require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  azericard: {
    gatewayUrl: process.env.AZERICARD_GATEWAY_URL,
    terminalId: process.env.AZERICARD_TERMINAL_ID,
    merchantName: process.env.AZERICARD_MERCHANT_NAME,
    merchantUrl: process.env.AZERICARD_MERCHANT_URL,
    privateKeyPath: process.env.RSA_PRIVATE_KEY_PATH,
    publicKeyPath: process.env.RSA_PUBLIC_KEY_PATH,
  },
  
  database: {
    uri: process.env.MONGODB_URI,
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET,
    apiKey: process.env.API_KEY,
    webhookSecret: process.env.WEBHOOK_SECRET,
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};