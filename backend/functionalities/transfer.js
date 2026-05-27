const pool = require('../db/mysql');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { webhookQueue } = require('../services/webhookQueue'); // To be created

const transfer = async (req, res) => {
  const connection = await pool.getConnection();
  const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
  
  if (!idempotencyKey) {
    connection.release();
    return res.status(400).send("Idempotency-Key is required");
  }

  try {
    // 1. SERIALIZABLE MySQL transactions for duplicate request safety
    await connection.query('SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE');
    await connection.beginTransaction();

    // 2. Idempotency Keys handling
    const [idemRows] = await connection.query('SELECT * FROM idempotency_keys WHERE idempotency_key = ?', [idempotencyKey]);
    if (idemRows.length > 0) {
      await connection.rollback();
      return res.status(409).send("Duplicate request detected");
    }

    await connection.query('INSERT INTO idempotency_keys (idempotency_key, status) VALUES (?, ?)', [idempotencyKey, 'STARTED']);

    const { userid, recieverUserid, profilePass, amount } = req.body;
    const transferAmount = parseFloat(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      throw new Error("Invalid amount");
    }

    // 3. Savepoint-based rollback logic
    await connection.query('SAVEPOINT before_transfer');

    const [senders] = await connection.query('SELECT * FROM users WHERE userid = ?', [userid]);
    if (senders.length === 0) throw new Error("Sender not found");
    const sender = senders[0];

    const isCorrect = await bcrypt.compare(profilePass, sender.profilePass);
    if (!isCorrect) throw new Error("Incorrect profile password");

    const [senderAccs] = await connection.query('SELECT * FROM accounts WHERE user_id = ? FOR UPDATE', [sender.id]);
    const senderAcc = senderAccs[0];
    if (parseFloat(senderAcc.balance) < transferAmount) {
      throw new Error("Balance low for transaction");
    }

    const [receivers] = await connection.query('SELECT * FROM users WHERE userid = ?', [recieverUserid]);
    if (receivers.length === 0) throw new Error("Receiver not found");
    const receiver = receivers[0];

    const [receiverAccs] = await connection.query('SELECT * FROM accounts WHERE user_id = ? FOR UPDATE', [receiver.id]);
    const receiverAcc = receiverAccs[0];

    const [beneficiaries] = await connection.query(
      'SELECT * FROM beneficiaries WHERE owner_id = ? AND bene_userid = ?',
      [sender.id, receiver.userid]
    );

    if (beneficiaries.length === 0) throw new Error("Receiver not in beneficiary list");
    if (transferAmount > parseFloat(beneficiaries[0].limit_amount)) {
      throw new Error("Transfer amount greater than beneficiary limit");
    }

    // Update balances
    await connection.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [transferAmount, senderAcc.id]);
    await connection.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [transferAmount, receiverAcc.id]);

    const transactionId = uuidv4();

    // 4. Double-Entry Ledger pattern
    await connection.query(
      `INSERT INTO ledger_entries (id, transaction_id, account_id, amount, type, description) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), transactionId, senderAcc.id, transferAmount, 'DEBIT', `Transfer to ${receiver.userid}`]
    );

    await connection.query(
      `INSERT INTO ledger_entries (id, transaction_id, account_id, amount, type, description) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), transactionId, receiverAcc.id, transferAmount, 'CREDIT', `Transfer from ${sender.userid}`]
    );

    await connection.query('UPDATE idempotency_keys SET status = ? WHERE idempotency_key = ?', ['COMPLETED', idempotencyKey]);

    // Dispatch webhook
    if (webhookQueue) {
      await webhookQueue.add('transfer_success', {
        transactionId,
        senderUserid: sender.userid,
        receiverUserid: receiver.userid,
        amount: transferAmount,
        timestamp: new Date()
      });
    }

    await connection.commit();
    res.status(200).send("Transaction done successfully.");

  } catch (error) {
    const userErrors = ["Invalid amount", "Sender not found", "Incorrect profile password", "Balance low for transaction", "Receiver not found", "Receiver not in beneficiary list", "Transfer amount greater than beneficiary limit"];
    
    if (userErrors.includes(error.message)) {
       await connection.query('ROLLBACK TO SAVEPOINT before_transfer');
       await connection.query('UPDATE idempotency_keys SET status = ? WHERE idempotency_key = ?', ['FAILED', idempotencyKey]);
       await connection.commit(); 
       return res.status(400).send(error.message);
    } else {
       await connection.rollback();
       console.error("Transfer error:", error);
       res.status(500).send("Transaction error");
    }
  } finally {
    try {
      await connection.query('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    } catch(e) {}
    connection.release();
  }
};

module.exports = transfer;
