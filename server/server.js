import dotenv from "dotenv";
dotenv.config();
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

import { connect } from "./db.js";
import express from "express";
import cors from "cors";
import { getTransactions, saveTransaction } from "./db.js";

const app = express();
const port = process.env.PORT || 5000;

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
app.use(cors());
app.use(express.json()); // accept json

//db health check
connect();
const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID_CLIENT_ID": PLAID_CLIENT_ID,
      "PLAID_SECRET": PLAID_SECRET,
    },
  },
});
const client = new PlaidApi(config);

// Creates a Plaid link_token
app.post("/api/create_link_token", async (req, res) => {
  const request = {
    client_id: PLAID_CLIENT_ID,
    secret: PLAID_SECRET,
    user: { client_user_id: "user-123" },
    client_name: "Finance Tracker",
    products: ["transactions"],
    language: "en",
    country_codes: ["US"],
  };

  try {
    const response = await client.linkTokenCreate(request);
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating link token");
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("API running");
});

// GET all transactions
app.get("/transactions", async (req, res) => {
  try {
    const transactions = await getTransactions();
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching transactions");
  }
});

// POST transactions
app.post("/transactions", async (req, res) => {
  try {
    const newTransaction = await saveTransaction(req.body);
    res.status(201).json(newTransaction);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving transaction");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
