import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../lib/api";
import { useAuth } from "../state/AuthContext";
import { ensureDefaultPortfolios, type PortfolioOption } from "../lib/portfolio";

const colors = ["#0f9dff", "#06d6a0", "#ffd166", "#ef476f", "#8ecae6", "#ffb703"];

interface AllocationResponse {
  portfolioId: string;
  totalValue: number;
  allocation: Array<{ symbol: string; value: number; weight: number }>;
}

export default function AllocationChart() {
  const { auth } = useAuth();
  const [portfolioId, setPortfolioId] = useState("");
  const [options, setOptions] = useState<PortfolioOption[]>([]);
  const [data, setData] = useState<AllocationResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth) return;
    ensureDefaultPortfolios(auth, ["Bank", "IT", "Oil"])
      .then((items) => {
        setOptions(items);
        if (items.length) setPortfolioId(items[0].id);
      })
      .catch((e) => setError(e.message));
  }, [auth]);

  useEffect(() => {
    if (!auth || !portfolioId) return;
    api<AllocationResponse>(`/allocation?portfolioId=${portfolioId}`, {}, auth.accessToken)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [auth, portfolioId]);

  return (
    <div className="card">
      <h3>Portfolio Allocation</h3>
      {options.length > 0 && (
        <select value={portfolioId} onChange={(e) => setPortfolioId(e.target.value)}>
          {options.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      {error && <div className="error">{error}</div>}
      {data?.allocation?.length ? (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data.allocation} dataKey="value" nameKey="symbol" outerRadius={95} label>
                {data.allocation.map((_, idx) => (
                  <Cell key={idx} fill={colors[idx % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p>No holdings yet.</p>
      )}
      {data && <small>Total Value: ${Number(data.totalValue).toFixed(2)}</small>}
    </div>
  );
}
