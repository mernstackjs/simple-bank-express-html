const username = document.getElementById("username");
const password = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

const bankDiv = document.getElementById("bank");
const balanceSpan = document.getElementById("balance");
const amountInput = document.getElementById("amount");
const depositBtn = document.getElementById("deposit-btn");
const withdrawBtn = document.getElementById("withdraw-btn");
const txList = document.getElementById("transactions");

const getToken = () => localStorage.getItem("token");

/* =========================
   AUTH
========================= */

async function login() {
  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username.value,
      password: password.value,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error);
    return;
  }

  localStorage.setItem("token", data.token);
  showBank();
}

async function logout() {
  await fetch("/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  localStorage.removeItem("token");
  hideBank();
}

/* =========================
   BANK
========================= */

async function loadBalance() {
  const res = await fetch("/balance", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  const data = await res.json();
  balanceSpan.textContent = data.balance.toFixed(2);
}

async function loadTransactions() {
  const res = await fetch("/transactions", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  const data = await res.json();
  txList.innerHTML = "";

  data.transactions.forEach((tx) => {
    const li = document.createElement("li");
    li.className = tx.type === "DEPOSIT" ? "deposit" : "withdraw";
    li.textContent = `${tx.type} $${tx.amount.toFixed(
      2,
    )} → $${tx.balanceAfter.toFixed(2)} (${new Date(
      tx.date,
    ).toLocaleString()})`;
    txList.appendChild(li);
  });
}

async function deposit() {
  await transact("/deposit");
}

async function withdraw() {
  await transact("/withdraw");
}

async function transact(url) {
  const amount = parseFloat(amountInput.value);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ amount }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error);
    return;
  }

  balanceSpan.textContent = data.balance.toFixed(2);
  amountInput.value = "";
  loadTransactions();
}

/* =========================
   UI
========================= */

function showBank() {
  bankDiv.hidden = false;
  logoutBtn.hidden = false;
  loginBtn.hidden = true;
  loadBalance();
  loadTransactions();
}

function hideBank() {
  bankDiv.hidden = true;
  logoutBtn.hidden = true;
  loginBtn.hidden = false;
}

if (getToken()) {
  showBank();
}

/* =========================
   EVENTS
========================= */

loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);
depositBtn.addEventListener("click", deposit);
withdrawBtn.addEventListener("click", withdraw);
