CREATE SCHEMA IF NOT EXISTS finance_tracker;

CREATE TABLE IF NOT EXISTS finance_tracker.users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    plaid_access_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_tracker.transactions (
    id BIGSERIAL PRIMARY KEY,
    plaid_transaction_id TEXT UNIQUE,
    description VARCHAR(255),
    amount NUMERIC(12,2) NOT NULL,
    category VARCHAR(100),
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id INT REFERENCES finance_tracker.users(id)
);