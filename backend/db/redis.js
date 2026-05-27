const { Redis } = require('ioredis');
require('dotenv').config();

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null // Required by BullMQ
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

module.exports = redisClient;
