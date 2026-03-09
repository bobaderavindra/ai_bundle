import { FormEvent, useState } from "react";
import { useStockStream } from "../hooks/useStockStream";

interface StockTickerProps {
  symbols: string[];
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onAddSymbol: (symbol: string) => void;
}

export default function StockTicker({ symbols, activeSymbol, onSelectSymbol, onAddSymbol }: StockTickerProps) {
  const [symbolInput, setSymbolInput] = useState("");
  const ticks = useStockStream(symbols);

  function submitSymbol(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = symbolInput.trim().toUpperCase();
    if (!normalized) return;
    onAddSymbol(normalized);
    setSymbolInput("");
  }

  return (
    <div className="card">
      <h3>Live Prices</h3>
      <form className="ticker-form" onSubmit={submitSymbol}>
        <input
          type="text"
          value={symbolInput}
          onChange={(event) => setSymbolInput(event.target.value)}
          placeholder="Add symbol (ex: NVDA)"
          aria-label="Add share symbol"
        />
        <button type="submit">Load</button>
      </form>
      <div className="ticker-grid">
        {ticks.map((tick) => (
          <button
            key={tick.symbol}
            type="button"
            className={`ticker-item${tick.symbol === activeSymbol ? " is-active" : ""}`}
            onClick={() => onSelectSymbol(tick.symbol)}
            title={`Show ${tick.symbol} on chart`}
          >
            <span>{tick.symbol}</span>
            <strong>${tick.price.toFixed(2)}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
