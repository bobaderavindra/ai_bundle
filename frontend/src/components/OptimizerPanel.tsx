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

type InsightTone = "good" | "caution";

interface OptimizerInsight {
  tone: InsightTone;
  text: string;
}

function buildInsights(
  assets: AssetForm[],
  correlationMatrix: number[][],
  result: MeanVarianceResponse
): OptimizerInsight[] {
  const insights: OptimizerInsight[] = [];
  const weightBySymbol = new Map(result.suggestedAllocation.map((item) => [item.symbol, item.weight]));

  let strongestPair: { a: string; b: string; corr: number } | null = null;
  for (let i = 0; i < assets.length; i++) {
    for (let j = i + 1; j < assets.length; j++) {
      const corr = correlationMatrix[i]?.[j] ?? 0;
      if (!strongestPair || corr > strongestPair.corr) {
        strongestPair = { a: assets[i].symbol, b: assets[j].symbol, corr };
      }
    }
  }

  if (strongestPair && strongestPair.corr >= 0.7) {
    const combinedWeight =
      (weightBySymbol.get(strongestPair.a) ?? 0) + (weightBySymbol.get(strongestPair.b) ?? 0);
    insights.push({
      tone: "caution",
      text: `${strongestPair.a} and ${strongestPair.b} are highly correlated (${strongestPair.corr.toFixed(
        2
      )}). Optimizer keeps their combined weight at ${(combinedWeight * 100).toFixed(
        1
      )}% to avoid concentration in similar risk drivers.`
    });
  }

  const assetsWithScore = assets
    .map((asset) => {
      const expectedReturn = Number(asset.expectedReturn);
      const volatility = Number(asset.volatility);
      const score = volatility > 0 ? expectedReturn / volatility : -Infinity;
      return { symbol: asset.symbol, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = assetsWithScore[0];
  if (best) {
    const bestWeight = weightBySymbol.get(best.symbol) ?? 0;
    insights.push({
      tone: "good",
      text: `${best.symbol} has the strongest return-to-risk profile in your inputs, so optimizer increases its allocation to ${(bestWeight * 100).toFixed(
        1
      )}% when diversification allows it.`
    });
  }

  insights.push({
    tone: "good",
    text: `Target is risk-adjusted efficiency: portfolio Sharpe is ${result.sharpeRatio.toFixed(
      3
    )}, which means maximizing return per unit of volatility, not just raw return.`
  });

  return insights;
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
  const [insights, setInsights] = useState<OptimizerInsight[]>([]);

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
    setInsights([]);

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
      setInsights(buildInsights(assets, correlationMatrix, response));
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
          {insights.length > 0 && (
            <ul className="optimizer-insights">
              {insights.map((insight) => (
                <li key={insight.text} className={`optimizer-insight-line tone-${insight.tone}`}>
                  <span className={`optimizer-insight-tag tone-${insight.tone}`}>{insight.tone.toUpperCase()}</span>
                  <span>{insight.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
