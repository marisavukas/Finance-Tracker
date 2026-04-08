import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

// Create connection to Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  //add ssl when deploying
});

// Tests DB connectivity
export const connect = async () => {
  const testQuery = "SELECT NOW()";
  const res = await pool.query(testQuery);
  console.log("DB connected - current time:", res.rows[0].now);
};

// reads all transactions from DB
export const getTransactions = async (userId) => {
  const query = `
    SELECT * 
    FROM finance_tracker.transactions 
    WHERE user_id = $1
    ORDER BY transaction_date DESC;
    `
  const res = await pool.query(query, [userId]);
  return res.rows;
  // TODO: map res.rows for cleaner object for frontend
};

// inserts a manual transaction
export const saveTransaction = async (transaction, userId) => {
  const { description, amount, category, transaction_date } = transaction;
  const text = `
        INSERT INTO finance_tracker.transactions
        (description, amount, category, transaction_date, user_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;

  const values = [description, amount, category, transaction_date, userId];

  const res = await pool.query(text, values);
  return res.rows[0];
};

// inserts plaid transactions
// prevents duplicates using plaid_transaction_id
export const savePlaidTransactions = async (transactions, userId) => {
  const query = `
    INSERT INTO finance_tracker.transactions
    (plaid_transaction_id, description, amount, category, transaction_date, user_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (plaid_transaction_id) DO NOTHING
  `;

  for (const t of transactions) {
    await pool.query(query, [
      t.transaction_id,
      t.name,
      t.amount,
      t.category?.[0] || null,
      t.date,
      userId
    ]);
  }
};

// look up user by email
export const getUserByEmail = async (email) => {
  const res = await pool.query(
    "SELECT * FROM finance_tracker.users WHERE email = $1",
    [email]
  );
  return res.rows[0];
}

// creates a new user
export const createUser = async (email, passwordHash) => {
  const res = await pool.query(
    `INSERT INTO finance_tracker.users (email, password_hash)
    VALUES ($1, $2)
    RETURNING id, email, created_at`,
    [email, passwordHash]
  );

  return res.rows[0];
} 

// saves plaid access token for user
export const savePlaidAccessToken = async(userId, accessToken) => {
  await pool.query(
    "UPDATE finance_tracker.users SET plaid_access_token = $1 WHERE id = $2",
    [accessToken, userId]
  );
}

// gets plaid access token for user
export const getPlaidAccessToken = async (userId) => {
  const res = await pool.query(
    "SELECT plaid_access_token FROM finance_tracker.users WHERE id = $1",
    [userId]
  );
  return res.rows[0]?.plaid_access_token;
};


export default pool;
