import { useStockStream } from "../hooks/useStockStream";

export default function StockTicker() {
  const ticks = useStockStream();
  return (
    <div className="card">
      <h3>Live Prices</h3>
      <div className="ticker-grid">
        {ticks.map((tick) => (
          <div key={tick.symbol} className="ticker-item">
            <span>{tick.symbol}</span>
            <strong>${tick.price.toFixed(2)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
