import dotenv from "dotenv";
dotenv.config();
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

import express from "express";
import cors from "cors";
import {
  connect,
  getTransactions,
  saveTransaction,
  savePlaidTransactions,
  getUserByEmail,
  createUser,
  savePlaidAccessToken,
  getPlaidAccessToken
} from "./db.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

const requireAuth = ( req, res, next ) => {
  const authHeader = req.headers.authorization; // JWT the frontend sent 

  if (!authHeader) {
    return res.status(401).send("Not logged in");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).send("Invalid token");
  }
};

// register a new user
app.post("/auth/register", async (req,res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send("Email and password required");
    }
    
    const existing = await getUserByEmail(email);
    if (existing)
    {
      return res.status(400).send("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(email, passwordHash);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ token, user });
  } catch(error)
  {
    console.error(error.message);
    res.status(500).send("Server Error. User not Saved.");
  }
})

// log in
app.post("/auth/login", async(req, res) => {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });  
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
    {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });
    res.json({token});

  } catch(error) {
    console.error(error.message);
    res.status(500).send("Error logging in");
  }
})

// plaid routes
// Creates a Plaid link_token for the frontend to initialize Plaid Link
app.post("/api/create_link_token", requireAuth, async (req, res) => {
  const request = {
    client_id: PLAID_CLIENT_ID,
    secret: PLAID_SECRET,
    user: { client_user_id: String(req.userId) },
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

// Exchanges the public_token received from Plaid Link 
// for an access_token
app.post("/api/exchange_public_token", requireAuth, async (req, res) => {
  try {
    const { public_token } = req.body;

    if (!public_token) {
      return res.status(400).send("Missing public_token");
    }

    const response = await client.itemPublicTokenExchange({
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      public_token,
    });

    await savePlaidAccessToken(req.userId, response.data.access_token);

    res.json({ success: true });
  } catch (error) {
    console.error("Exchange token error:", error.response?.data || error);
    res.status(500).send("Error exchanging public token");
  }
});

// health check
app.get("/", (req, res) => {
  res.send("API running");
});

// fetches transactions from Plaid and saves to DB
app.get("/api/plaid/transactions", requireAuth, async (req, res) => {
  console.log("sync route hit, userId:", req.userId); 
  try {
    const accessToken = await getPlaidAccessToken(req.userId); 

    if (!accessToken) {
      return res.status(400).send("No bank account connected");
    }

    const today = new Date().toISOString().split("T")[0]; // "2026-04-07"
    const startDate = "2020-01-01";
    const response = await client.transactionsGet({
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      access_token: accessToken,
      start_date: startDate,
      end_date: today,
      options:
      {
        count:100,
        offset:0
      }
    });
    
    console.log("Plaid response:", response.data.transactions.length);
    console.log("Total transactions:", response.data.total_transactions);
  
    await savePlaidTransactions(response.data.transactions, req.userId);
    
    console.log(
      "Plaid fetched:",
      response.data.transactions.length
    );

    res.json({
      saved: response.data.transactions.length,
      message: response.data.transactions.length === 0
        ? "No new transactions"
        : "Transactions synced"
    });
  } catch (err){
    console.error(err);
    res.status(500).send("Error fetching Plaid transactions");
  }
});


// reads all transactions from DB 
app.get("/transactions", requireAuth, async (req, res) => {  
  try {
    const transactions = await getTransactions(req.userId);
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching transactions");
  }
});

// saves a manual transaction.
app.post("/transactions", async (req, res) => {
  try {
    const newTransaction = await saveTransaction(req.body, req.userId);
    res.status(201).json(newTransaction);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving transaction");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


