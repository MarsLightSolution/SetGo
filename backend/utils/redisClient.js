// utils/redisClient.js
const redis = require('redis');
require("dotenv").config();

const client = redis.createClient({
    password: process.env.REDIS_PASSWORD, 
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});
const logger = require('../utils/logger');

client.on('error', (err) => {
    logger.error('Redis Client Error', { message: err.message, stack: err.stack });
});

client.connect() // returns a promise
    .then(() => logger.info('Redis connected successfully'))
    .catch(err => logger.error('Redis connection failed', { message: err.message, stack: err.stack }));

module.exports = client;
