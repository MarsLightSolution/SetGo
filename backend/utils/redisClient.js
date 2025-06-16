// utils/redisClient.js
const redis = require('redis');

const client = redis.createClient({
    url: 'redis://localhost:6379' // Redis default port
});

client.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
});

client.connect() // returns a promise
    .then(() => console.log('✅ Redis connected successfully'))
    .catch(console.error);

module.exports = client;
