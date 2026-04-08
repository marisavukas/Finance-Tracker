import "./App.css";
import { useState, useEffect, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [linkToken, setLinkToken] = useState(null);

  const [loading, setLoading] = useState(true);
  const [linkTokenLoading, setLinkTokenLoading] = useState(true);

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // fetch link_token from Plaid API
  useEffect(() => {
    const fetchLinkToken = async () => {
      setLinkTokenLoading(true);
      try {
        const response = await fetch(
          "http://localhost:3001/api/create_link_token",
          { method: "POST" ,
          headers: {"Authorization": `Bearer ${token}`}
          }
        );
        const data = await response.json();
        setLinkToken(data.link_token);
      } catch (error) {
        console.error(
          "Plaid Error:",
          error.response?.data || error.message || error
        );
      } finally {
        setLinkTokenLoading(false);
      }
    };

    if (token) {
      fetchLinkToken();
    }
  }, [token]);

  const handleLogin = async () => {
    const response = await fetch("http://localhost:3001/auth/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email, password})
    });

    // save jwt to localStorage
    const data = await response.json();
    console.log("login response", data);

    if (!response.ok)
    {
      alert(data);
      return;

    }
    localStorage.setItem("token", data.token);
    setToken(data.token);
  }
const fetchTransactions = useCallback(async () => {
  try {
    const response = await fetch("http://localhost:3001/transactions", {
      headers: {"Authorization": `Bearer ${token}`}
    }); 
    const json = await response.json();
    setTransactions(json);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}, [token]); 

useEffect(() => {
  if (token) fetchTransactions();
  else setLoading(false);
}, [token, fetchTransactions]); 

// and syncTransactions calls it too after syncing
const syncTransactions = async () => {
  const response = await fetch("http://localhost:3001/api/plaid/transactions", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await response.json();
  alert(`Synced ${data.saved} transactions`);
  await fetchTransactions(); // ← refresh the list
};
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token) => {
      await fetch("http://localhost:3001/api/exchange_public_token", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ public_token }),
      });

      alert("Bank connected 🎉");
    },
  })

  if (loading) {
    return <p>Loading...</p>;
  }



return (
  <div>
    {token ? (
      // logged in 
      <div>
        <button onClick={() => open()} disabled={!ready || linkTokenLoading}>
          Connect Bank
        </button>
        <button onClick={syncTransactions}>Sync Transactions</button>
        {transactions.length === 0
          ? <p>No transactions yet</p>
          : <>
              <h1>Transactions</h1>
              <ul>
                {transactions.map((t) => (
                  <li key={t.id}>
                    {t.description} - ${t.amount}
                  </li>
                ))}
              </ul>
            </>
        }
      </div>
    ) : (
      // logged out 
      <div>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <button onClick={handleLogin}>Login</button>
      </div>
    )}
  </div>
);
}
export default App;
