import { FormEvent, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../state/AuthContext";

export default function TradePanel() {
  const { auth } = useAuth();
  const [portfolioId, setPortfolioId] = useState("");
  const [symbol, setSymbol] = useState("AAPL");
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("10");
  const [price, setPrice] = useState("180");
  const [result, setResult] = useState("");

  if (!auth) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!auth) return;
    try {
      const res = await api<{ id: string }>("/trade", {
        method: "POST",
        body: JSON.stringify({
          portfolioId,
          symbol,
          tradeType,
          quantity: Number(quantity),
          price: Number(price)
        })
      }, auth.accessToken);
      setResult(`Trade posted: ${res.id}`);
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Trade failed");
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>Trade Execution</h3>
      <input placeholder="Portfolio ID" value={portfolioId} onChange={(e) => setPortfolioId(e.target.value)} />
      <div className="row">
        <input placeholder="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        <select value={tradeType} onChange={(e) => setTradeType(e.target.value as "BUY" | "SELL")}>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
      </div>
      <div className="row">
        <input placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <input placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <button type="submit">Submit Trade</button>
      {result && <small>{result}</small>}
    </form>
  );
}
