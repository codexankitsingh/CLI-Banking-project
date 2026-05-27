import http from 'k6/http';
import { check, sleep } from 'k6';

// 800+ TPS simulation config
export const options = {
  stages: [
    { duration: '10s', target: 200 }, // Ramp up
    { duration: '30s', target: 800 }, // Peak load (800 VUs)
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    // Resume claim: p99 < 50 ms
    http_req_duration: ['p(99)<50'], 
    http_req_failed: ['rate<0.01'], 
  },
};

export default function () {
  // Simulating the high-throughput Redis cached balance endpoint
  const userid = 'USER_' + Math.floor(Math.random() * 100); 
  const res = http.get(`http://localhost:3000/balance?userid=${userid}`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'latency < 50ms': (r) => r.timings.duration < 50,
  });

  // Adding some random transfers to test the double-entry ledger & idempotency concurrency
  if (Math.random() > 0.9) { // 10% of requests are transfers
    const idempotencyKey = 'idemp_' + Math.random().toString(36).substring(7);
    const transferRes = http.post('http://localhost:3000/transfer', JSON.stringify({
      userid: 'USER_1',
      recieverUserid: 'USER_2',
      profilePass: 'password123',
      amount: 10
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      }
    });

    check(transferRes, {
      'transfer status 200 or 409': (r) => r.status === 200 || r.status === 409,
    });
  }

  sleep(1);
}
