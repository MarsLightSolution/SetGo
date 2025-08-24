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

client.on('error', (err) => {
    // console.error('Redis Client Error:', err);
});

client.connect() // returns a promise
    .then(() => console.log('Redis connected successfully'))
    .catch(console.error);

module.exports = client;
