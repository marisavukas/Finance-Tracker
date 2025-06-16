import "./App.css";
import { useState, useEffect } from "react";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [linkToken, setLinkToken] = useState(null);

  const [loading, setLoading] = useState(true);
  const [linkTokenLoading, setLinkTokenLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:5000/transactions"); //by default fetch() sends GET request
        if (!response.ok) {
          throw new Error(`HTTP error. Status: ${response.status}`);
        }
        const json = await response.json();
        setTransactions(json);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // fetch link_token from Plaid API
  useEffect(() => {
    const fetchLinkToken = async () => {
      setLinkTokenLoading(true);
      try {
        const response = await fetch(
          "http://localhost:5000/api/create_link_token",
          { method: "POST" }
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

    fetchLinkToken();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  return (
    <div>
      <h1>Transactions</h1>
      <ul>
        {transactions.map((t) => (
          <li key={t.id}>
            {t.description} - ${t.amount}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
