import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../state/AuthContext";

interface OptimizerPanelProps {
  symbols: string[];
}

interface AssetForm {
  symbol: string;
  expectedReturn: string;
  volatility: string;
}

interface MeanVarianceResponse {
  suggestedAllocation: Array<{ symbol: string; weight: number }>;
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
}

function buildCorrelation(size: number, offDiagonal = 0.3): number[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => (row === col ? 1 : offDiagonal))
  );
}

export default function OptimizerPanel({ symbols }: OptimizerPanelProps) {
  const { auth } = useAuth();
  const [assets, setAssets] = useState<AssetForm[]>([]);
  const [correlationMatrix, setCorrelationMatrix] = useState<number[][]>([]);
  const [riskFreeRate, setRiskFreeRate] = useState("0.03");
  const [iterations, setIterations] = useState("4000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MeanVarianceResponse | null>(null);

  useEffect(() => {
    const nextAssets = symbols.map((symbol) => {
      const prev = assets.find((item) => item.symbol === symbol);
      return {
        symbol,
        expectedReturn: prev?.expectedReturn ?? "0.12",
        volatility: prev?.volatility ?? "0.20"
      };
    });
    setAssets(nextAssets);

    const indexBySymbol = new Map(assets.map((asset, idx) => [asset.symbol, idx]));
    const nextMatrix = symbols.map((rowSymbol, row) =>
      symbols.map((colSymbol, col) => {
        if (row === col) return 1;
        const oldRow = indexBySymbol.get(rowSymbol);
        const oldCol = indexBySymbol.get(colSymbol);
        if (oldRow === undefined || oldCol === undefined) return 0.3;
        const preserved = correlationMatrix[oldRow]?.[oldCol];
        return typeof preserved === "number" ? preserved : 0.3;
      })
    );
    setCorrelationMatrix(nextMatrix.length ? nextMatrix : buildCorrelation(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols]);

  const isReady = useMemo(
    () => assets.length >= 2 && correlationMatrix.length === assets.length,
    [assets.length, correlationMatrix.length]
  );

  function updateAsset(index: number, field: "expectedReturn" | "volatility", value: string) {
    setAssets((prev) => prev.map((asset, i) => (i === index ? { ...asset, [field]: value } : asset)));
  }

  function updateCorrelation(row: number, col: number, value: string) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;

    const clamped = Math.max(-1, Math.min(1, parsed));
    setCorrelationMatrix((prev) =>
      prev.map((matrixRow, r) =>
        matrixRow.map((matrixValue, c) => {
          if (r === row && c === col) return clamped;
          if (r === col && c === row) return clamped;
          return matrixValue;
        })
      )
    );
  }

  async function optimize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth) return;

    if (!isReady) {
      setError("Add at least 2 symbols in Live Prices before optimization.");
      return;
    }

    const parsedAssets = assets.map((asset) => ({
      symbol: asset.symbol,
      expectedReturn: Number(asset.expectedReturn),
      volatility: Number(asset.volatility)
    }));

    if (parsedAssets.some((asset) => Number.isNaN(asset.expectedReturn) || Number.isNaN(asset.volatility))) {
      setError("Expected return and volatility must be numeric values.");
      return;
    }

    if (parsedAssets.some((asset) => asset.volatility <= 0)) {
      setError("Volatility must be greater than 0 for every asset.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await api<MeanVarianceResponse>(
        "/optimization/mean-variance",
        {
          method: "POST",
          body: JSON.stringify({
            assets: parsedAssets,
            correlationMatrix,
            riskFreeRate: Number(riskFreeRate),
            iterations: Number(iterations)
          })
        },
        auth.accessToken
      );
      setResult(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Optimization request failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!auth) return null;

  return (
    <form className="card" onSubmit={optimize}>
      <h3>Portfolio Optimizer (Mean-Variance)</h3>
      <div className="optimizer-controls row">
        <input
          value={riskFreeRate}
          onChange={(event) => setRiskFreeRate(event.target.value)}
          placeholder="Risk free rate (ex: 0.03)"
        />
        <input
          value={iterations}
          onChange={(event) => setIterations(event.target.value)}
          placeholder="Iterations (200-20000)"
        />
      </div>

      <div className="optimizer-assets">
        {assets.map((asset, index) => (
          <div key={asset.symbol} className="optimizer-asset-row">
            <strong>{asset.symbol}</strong>
            <input
              value={asset.expectedReturn}
              onChange={(event) => updateAsset(index, "expectedReturn", event.target.value)}
              placeholder="Expected return"
            />
            <input
              value={asset.volatility}
              onChange={(event) => updateAsset(index, "volatility", event.target.value)}
              placeholder="Volatility"
            />
          </div>
        ))}
      </div>

      <div className="optimizer-matrix-wrap">
        <h4>Correlation Matrix</h4>
        <div className="optimizer-matrix">
          <table>
            <thead>
              <tr>
                <th />
                {assets.map((asset) => (
                  <th key={`head-${asset.symbol}`}>{asset.symbol}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.map((rowAsset, row) => (
                <tr key={`row-${rowAsset.symbol}`}>
                  <th>{rowAsset.symbol}</th>
                  {assets.map((colAsset, col) => (
                    <td key={`${rowAsset.symbol}-${colAsset.symbol}`}>
                      {row === col ? (
                        <input value="1" disabled />
                      ) : (
                        <input
                          value={String(correlationMatrix[row]?.[col] ?? 0.3)}
                          onChange={(event) => updateCorrelation(row, col, event.target.value)}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Optimizing..." : "Run Optimization"}
      </button>
      {error && <div className="error">{error}</div>}

      {result && (
        <div className="optimizer-result">
          <h4>Suggested Allocation</h4>
          <div className="optimizer-allocation-grid">
            {result.suggestedAllocation.map((item) => (
              <div key={item.symbol} className="pill">
                {item.symbol}: {(item.weight * 100).toFixed(2)}%
              </div>
            ))}
          </div>
          <small>
            Expected Return: {(result.expectedReturn * 100).toFixed(2)}% | Volatility:{" "}
            {(result.expectedVolatility * 100).toFixed(2)}% | Sharpe: {result.sharpeRatio.toFixed(3)}
          </small>
        </div>
      )}
    </form>
  );
}
