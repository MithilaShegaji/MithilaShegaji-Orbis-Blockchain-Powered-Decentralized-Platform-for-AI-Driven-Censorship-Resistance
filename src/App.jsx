import { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";

function App() {
  const [account, setAccount] = useState(null);
  const [articles, setArticles] = useState([]);

  async function connectWallet() {
    if (!window.ethereum) return alert("Install MetaMask!");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
  }

  async function fetchArticles() {
    const res = await axios.get("http://localhost:4000/articles/1");
    setArticles([res.data]);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🌐 Orbis</h1>
        {account ? (
          <span className="bg-green-200 px-3 py-1 rounded">{account}</span>
        ) : (
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Connect Wallet
          </button>
        )}
      </header>

      <main>
        <button
          onClick={fetchArticles}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Fetch Article #1
        </button>

        <div className="mt-6 space-y-4">
          {articles.map((a, i) => (
            <div key={i} className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold">Article {a[0].toString()}</h2>
              <p><strong>Author:</strong> {a[1]}</p>
              <p><strong>CID:</strong> {a[2]}</p>
              <p><strong>Trust Score:</strong> {a[4].toString()}</p>
              <p><strong>Status:</strong> {a[5].toString()}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
