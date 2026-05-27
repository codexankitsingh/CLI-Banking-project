const pool = require('./mysql');

async function initDB() {
  try {
    const connection = await pool.getConnection();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        userid VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        profilePass VARCHAR(255) NOT NULL,
        encrypted_pii TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        balance DECIMAL(15, 2) DEFAULT 0.00,
        currency VARCHAR(10) DEFAULT 'INR',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS beneficiaries (
        id VARCHAR(36) PRIMARY KEY,
        owner_id VARCHAR(36) NOT NULL,
        bene_userid VARCHAR(50) NOT NULL,
        limit_amount DECIMAL(15, 2) DEFAULT 0.00,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ledger_entries (
        id VARCHAR(36) PRIMARY KEY,
        transaction_id VARCHAR(36) NOT NULL,
        account_id VARCHAR(36) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL, 
        type ENUM('DEBIT', 'CREDIT') NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      )
    `);

    try {
      await connection.query(`CREATE INDEX idx_ledger_acc_date ON ledger_entries(account_id, created_at DESC)`);
    } catch (e) {
      if (e.code !== 'ER_DUP_KEYNAME') console.log('Index idx_ledger_acc_date exists or error:', e.message);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        idempotency_key VARCHAR(100) PRIMARY KEY,
        status ENUM('STARTED', 'COMPLETED', 'FAILED') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id VARCHAR(36) PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        payload JSON NOT NULL,
        status ENUM('PENDING', 'DELIVERED', 'FAILED', 'DEAD_LETTER') DEFAULT 'PENDING',
        retry_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Database schema initialized successfully.");
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

initDB();
