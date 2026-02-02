import express from "express";
import crypto from "crypto";

const app = express();
const PORT = 3001;

/* =========================
   BUILT-IN MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.static("public"));

/* =========================
   CUSTOM MIDDLEWARE
========================= */

// Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Auth middleware
const sessions = new Map();

const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = auth.replace("Bearer ", "");
  const user = sessions.get(token);

  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = user;
  next();
};

// Validate amount
const validateAmount = (req, res, next) => {
  const { amount } = req.body;

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  next();
};

/* =========================
   MOCK USER
========================= */
const USER = {
  username: "admin",
  password: "password123",
};

/* =========================
   BANK STATE
========================= */
let balance = 0;
let transactions = [];

/* =========================
   AUTH ROUTES
========================= */

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username !== USER.username || password !== USER.password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = crypto.randomUUID();
  sessions.set(token, username);

  res.json({ token });
});

app.post("/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  sessions.delete(token);
  res.json({ message: "Logged out" });
});

/* =========================
   BANK ROUTES
========================= */

app.get("/balance", requireAuth, (req, res) => {
  res.json({ balance });
});

app.get("/transactions", requireAuth, (req, res) => {
  res.json({ transactions });
});

app.post("/deposit", requireAuth, validateAmount, (req, res) => {
  const { amount } = req.body;

  balance += amount;

  transactions.unshift({
    id: crypto.randomUUID(),
    type: "DEPOSIT",
    amount,
    balanceAfter: balance,
    date: new Date().toISOString(),
  });

  res.json({ balance });
});

app.post("/withdraw", requireAuth, validateAmount, (req, res) => {
  const { amount } = req.body;

  if (amount > balance) {
    return res.status(400).json({ error: "Insufficient funds" });
  }

  balance -= amount;

  transactions.unshift({
    id: crypto.randomUUID(),
    type: "WITHDRAW",
    amount,
    balanceAfter: balance,
    date: new Date().toISOString(),
  });

  res.json({ balance });
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
