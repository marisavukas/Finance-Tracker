import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

// Create connection to Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  //add ssl when deploying
});

export const connect = async () => {
  const testQuery = "SELECT NOW()";
  const res = await pool.query(testQuery);
  console.log("DB connected - current time:", res.rows[0].now);
};

export const getTransactions = async () => {
  const query =
    "SELECT * FROM finance_tracker.transactions ORDER BY transaction_date DESC";
  const res = await pool.query(query);
  // console.log(res.rows);
  return res.rows;
  // TODO: map res.rows for cleaner object for frontend
};

export const saveTransaction = async (transaction) => {
  const { description, amount, category, transaction_date } = transaction;
  const text = `
        INSERT INTO finance_tracker.transactions
        (description, amount, category, transaction_date)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;

  const values = [description, amount, category, transaction_date];

  const res = await pool.query(text, values);
  //console.log(res.rows[0]);
  return res.rows[0];
};

export default pool;
