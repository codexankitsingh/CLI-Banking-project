const { Worker } = require('bullmq');
const crypto = require('crypto');
const axios = require('axios');
const pool = require('../db/mysql');
const redisClient = require('../db/redis');
require('dotenv').config();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'whsec_mysupersecretkey';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:4000/webhook-receive';

const webhookWorker = new Worker('webhooks', async job => {
  const payload = job.data;
  
  // 1. Redis Deduplication
  const dedupKey = `webhook_dispatch:${payload.transactionId}`;
  const isDuplicate = await redisClient.set(dedupKey, '1', 'NX', 'EX', 3600); 
  if (!isDuplicate) {
    console.log(`Duplicate webhook detected for tx: ${payload.transactionId}, skipping.`);
    return;
  }

  // 2. Generate HMAC Signature mirroring Stripe pattern
  const payloadString = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payloadString).digest('hex');

  try {
    // 3. Dispatch Webhook
    const response = await axios.post(WEBHOOK_URL, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': `t=${Date.now()},v1=${signature}`
      },
      timeout: 5000
    });
    
    // 4. Log Success to MySQL
    await pool.query(
      'INSERT INTO webhook_events (id, event_type, payload, status, retry_count) VALUES (?, ?, ?, ?, ?)',
      [job.id, job.name, payloadString, 'DELIVERED', job.attemptsMade]
    );

    return response.data;
  } catch (error) {
    console.error(`Webhook delivery failed for job ${job.id}:`, error.message);
    throw error; // BullMQ handles exponential backoff based on throw
  }
}, { 
  connection: redisClient 
});

webhookWorker.on('failed', async (job, err) => {
  if (job.attemptsMade >= job.opts.attempts) {
    console.log(`Job ${job.id} failed permanently, adding to Dead Letter Queue.`);
    await pool.query(
      'INSERT INTO webhook_events (id, event_type, payload, status, retry_count) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status="DEAD_LETTER", retry_count=?',
      [job.id, job.name, JSON.stringify(job.data), 'DEAD_LETTER', job.attemptsMade, job.attemptsMade]
    );
  }
});

module.exports = { webhookWorker };
