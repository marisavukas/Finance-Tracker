CREATE SCHEMA IF NOT EXISTS finance_tracker;

CREATE TABLE IF NOT EXISTS finance_tracker.transactions (
	id BIGSERIAL PRIMARY KEY,
	description VARCHAR(255),
	amount NUMERIC(12,2) NOT NULL,
	category VARCHAR(100),
	transaction_date DATE NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);