import "./App.css";
import { useState, useEffect } from "react";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
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
  }, []); //empty dep array ensures this runs only once on mount

  console.log("transactions", transactions);
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
