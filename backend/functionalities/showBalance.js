const pool = require('../db/mysql');
const redisClient = require('../db/redis');

const showBalance = async (req, res) => {
  const userid = req.body.userid || req.query.userid; 

  try {
    // 1. Try to get balance from Redis Cache
    const cacheKey = `balance:${userid}`;
    const cachedBalance = await redisClient.get(cacheKey);

    if (cachedBalance) {
      return res.status(200).json({ balance: cachedBalance, cached: true });
    }

    // 2. Cache miss, query MySQL
    const [users] = await pool.query('SELECT id FROM users WHERE userid = ?', [userid]);
    if (users.length === 0) return res.status(404).send("User not found");
    const user = users[0];

    const [accounts] = await pool.query('SELECT balance FROM accounts WHERE user_id = ?', [user.id]);
    if (accounts.length === 0) return res.status(404).send("Account not found");
    const balance = accounts[0].balance;

    // 3. Set to Redis Cache (TTL of 10 seconds)
    await redisClient.set(cacheKey, balance, 'EX', 10);

    res.status(200).json({ balance, cached: false });
  } catch (error) {
    console.error("ShowBalance Error:", error);
    res.status(500).send("Error fetching balance");
  }
};

module.exports = showBalance;
