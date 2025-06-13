import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { getTransactions, saveTransaction } from "./db.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // accept json

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
