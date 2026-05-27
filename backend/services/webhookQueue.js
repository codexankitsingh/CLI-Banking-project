const { Queue } = require('bullmq');
const redisClient = require('../db/redis');

// Exponential backoff configuration built into BullMQ
const webhookQueue = new Queue('webhooks', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000 // 2s, 4s, 8s, 16s...
    },
    removeOnComplete: true,
    removeOnFail: 100 // Keep last 100 failed jobs for audit
  }
});

module.exports = { webhookQueue };
