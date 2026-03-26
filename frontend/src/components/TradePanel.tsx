import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import { createPortfolio, ensureDefaultPortfolios, fetchPortfolios, type PortfolioOption } from "../lib/portfolio";
import { useStockStream } from "../hooks/useStockStream";
import { useAuth } from "../state/AuthContext";

export default function TradePanel() {
  const { auth } = useAuth();
  const [portfolioId, setPortfolioId] = useState("");
  const [portfolios, setPortfolios] = useState<PortfolioOption[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState("");
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [creatingPortfolio, setCreatingPortfolio] = useState(false);
  const [symbol, setSymbol] = useState("AAPL");
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("10");
  const [price, setPrice] = useState("180");
  const [result, setResult] = useState("");
  const [autoPrice, setAutoPrice] = useState(true);
  const ticks = useStockStream([symbol]);
  const livePrice = ticks[0]?.price;

  if (!auth) return null;

  useEffect(() => {
    let cancelled = false;
    setPortfolioLoading(true);
    setPortfolioError("");
    ensureDefaultPortfolios(auth, ["Bank", "IT", "Oil"])
      .then((items) => {
        if (cancelled) return;
        setPortfolios(items);
        if (items.length) setPortfolioId(items[0].id);
      })
      .catch((e) => {
        if (cancelled) return;
        setPortfolioError(e.message || "Unable to load portfolios");
      })
      .finally(() => {
        if (cancelled) return;
        setPortfolioLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth]);

  useEffect(() => {
    if (!autoPrice || livePrice == null) return;
    setPrice(livePrice.toFixed(2));
  }, [autoPrice, livePrice]);

  async function refreshPortfolios(nextSelectedId?: string) {
    if (!auth) return;
    setPortfolioLoading(true);
    setPortfolioError("");
    try {
      const items = await fetchPortfolios(auth);
      setPortfolios(items);
      if (nextSelectedId) {
        setPortfolioId(nextSelectedId);
      } else if (items.length && !portfolioId) {
        setPortfolioId(items[0].id);
      }
    } catch (e) {
      setPortfolioError(e instanceof Error ? e.message : "Unable to load portfolios");
    } finally {
      setPortfolioLoading(false);
    }
  }

  async function submitPortfolio() {
    if (!auth) return;
    const name = newPortfolioName.trim();
    if (!name) return;
    setCreatingPortfolio(true);
    setPortfolioError("");
    try {
      const created = await createPortfolio(auth, name);
      setNewPortfolioName("");
      await refreshPortfolios(created.id);
    } catch (e) {
      setPortfolioError(e instanceof Error ? e.message : "Portfolio creation failed");
    } finally {
      setCreatingPortfolio(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!auth) return;
    if (!portfolioId) {
      setResult(
        portfolioLoading
          ? "Loading portfolios. Please wait."
          : "Select a portfolio before submitting"
      );
      return;
    }
    try {
      const res = await api<{ id: string }>("/trade", {
        method: "POST",
        body: JSON.stringify({
          portfolioId,
          symbol: symbol.trim(),
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
      <div className="row">
        <input
          placeholder="New portfolio name (ex: Bank)"
          value={newPortfolioName}
          onChange={(e) => setNewPortfolioName(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void submitPortfolio()}
          disabled={creatingPortfolio || !newPortfolioName.trim()}
        >
          {creatingPortfolio ? "Creating..." : "Create"}
        </button>
      </div>
      {portfolioLoading ? (
        <small>Loading portfolios...</small>
      ) : portfolios.length > 0 ? (
        <select value={portfolioId} onChange={(e) => setPortfolioId(e.target.value)}>
          {portfolios.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      ) : (
        <small>No portfolios yet.</small>
      )}
      {portfolioError && <small>{portfolioError}</small>}
      <div className="row">
        <input placeholder="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        <select value={tradeType} onChange={(e) => setTradeType(e.target.value as "BUY" | "SELL")}>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
      </div>
      <div className="row">
        <input placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <input
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          readOnly={autoPrice}
        />
      </div>
      <label>
        <input type="checkbox" checked={autoPrice} onChange={(e) => setAutoPrice(e.target.checked)} />
        Use live price
      </label>
      <button type="submit" disabled={portfolioLoading || !portfolioId}>
        Submit Trade
      </button>
      {result && <small>{result}</small>}
    </form>
  );
}
