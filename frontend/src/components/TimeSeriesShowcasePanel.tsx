import { CURRENCY_PREFIX } from "../lib/currency";
import { TIME_SERIES_SCENARIOS, type ScenarioId, type TimeSeriesSnapshot } from "../lib/timeSeriesShowcase";

interface TimeSeriesShowcasePanelProps {
  activeScenarioId: ScenarioId;
  onScenarioChange: (scenarioId: ScenarioId) => void;
  onRefresh: () => void;
  snapshot: TimeSeriesSnapshot | null;
  isLoading: boolean;
  error: string | null;
}

function formatCurrency(amount: number) {
  return `${CURRENCY_PREFIX}${amount.toFixed(0)}`;
}

export default function TimeSeriesShowcasePanel({
  activeScenarioId,
  onScenarioChange,
  onRefresh,
  snapshot,
  isLoading,
  error
}: TimeSeriesShowcasePanelProps) {
  const activeScenario = TIME_SERIES_SCENARIOS.find((scenario) => scenario.id === activeScenarioId) ?? TIME_SERIES_SCENARIOS[0];
  const anomalyLead = snapshot?.anomalies.alerts[0];
  const headlineInsight =
    snapshot?.patterns.insights[0] ??
    `Top category is ${snapshot?.patterns.topCategory?.category ?? "not available"} right now.`;

  return (
    <section className="ts-card">
      <header className="ts-header">
        <div>
          <p className="ts-kicker">ML Time-Series Studio</p>
          <h3>Live showcase of forecasting, behavior analysis, and alerting</h3>
        </div>
        <button type="button" className="ghost ts-refresh-btn" onClick={onRefresh}>
          Auto sample feed
        </button>
      </header>

      <div className="ts-scenario-row">
        {TIME_SERIES_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className={`ts-scenario-chip${scenario.id === activeScenario.id ? " is-active" : ""}`}
            onClick={() => onScenarioChange(scenario.id)}
          >
            <strong>{scenario.label}</strong>
            <span>{scenario.description}</span>
          </button>
        ))}
      </div>

      <div className="ts-stage">
        <section className="ts-timeline-panel">
          <div className="ts-stage-head">
            <div>
              <span className="ts-stage-label">Input timeline</span>
              <strong>{activeScenario.label}</strong>
            </div>
            <small>{activeScenario.series.length} events</small>
          </div>
          <div className="ts-bars" aria-hidden="true">
            {activeScenario.series.map((point) => {
              const height = Math.max(18, Math.round((point.amount / 420) * 100));
              return (
                <div key={`${point.date}-${point.amount}`} className="ts-bar-column">
                  <span style={{ height: `${Math.min(height, 100)}%` }} />
                  <small>{point.date.slice(5)}</small>
                </div>
              );
            })}
          </div>
          <ul className="ts-input-list">
            {activeScenario.series.slice(-4).map((point) => (
              <li key={`${point.date}-${point.category}`}>
                <span>{point.category ?? "General"}</span>
                <strong>{formatCurrency(point.amount)}</strong>
                <small>{point.date}</small>
              </li>
            ))}
          </ul>
        </section>

        <section className="ts-output-panel">
          <div className="ts-stage-head">
            <div>
              <span className="ts-stage-label">Model output</span>
              <strong>{isLoading ? "Running analytics..." : "Predictions ready"}</strong>
            </div>
            <small>{snapshot?.forecast.trend ?? "pending"}</small>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <div className="ts-metric-grid">
            <article className="ts-metric tone-indigo">
              <span>Expense Forecast</span>
              <strong>{snapshot ? formatCurrency(snapshot.forecast.predictedExpense) : "--"}</strong>
              <small>
                {snapshot?.forecast.budgetExceeded ? "Budget breach likely" : "Budget remains in range"}
              </small>
            </article>
            <article className="ts-metric tone-coral">
              <span>Unusual Transactions</span>
              <strong>{snapshot ? snapshot.anomalies.alerts.length : "--"}</strong>
              <small>{anomalyLead ? `${formatCurrency(anomalyLead.amount)} flagged` : "No anomalies detected"}</small>
            </article>
            <article className="ts-metric tone-teal">
              <span>Credit Risk</span>
              <strong>{snapshot?.credit.risk ?? "--"}</strong>
              <small>
                {snapshot ? `${Math.round(snapshot.credit.utilizationRate * 100)}% utilization forecast` : "Pending"}
              </small>
            </article>
            <article className="ts-metric tone-amber">
              <span>Trip Projection</span>
              <strong>{snapshot ? formatCurrency(snapshot.trip.projectedTotal) : "--"}</strong>
              <small>{snapshot?.trip.overBudget ? "Above trip budget" : "Within trip budget"}</small>
            </article>
          </div>

          <div className="ts-insight-ribbon">
            <strong>Pattern detection</strong>
            <p>{isLoading ? "Analyzing spending cadence..." : headlineInsight}</p>
          </div>

          <div className="ts-detail-grid">
            <article className="ts-detail-card">
              <span>Forecast window</span>
              <strong>
                {snapshot?.forecast.forecast[0]
                  ? `${snapshot.forecast.forecast[0].date} -> ${formatCurrency(snapshot.forecast.forecast[0].amount)}`
                  : "--"}
              </strong>
              <small>Trend: {snapshot?.forecast.trend ?? "pending"}</small>
            </article>
            <article className="ts-detail-card">
              <span>Top category</span>
              <strong>
                {snapshot?.patterns.topCategory
                  ? `${snapshot.patterns.topCategory.category} ${formatCurrency(snapshot.patterns.topCategory.amount)}`
                  : "--"}
              </strong>
              <small>Behavior breakdown from the selected sample series</small>
            </article>
            <article className="ts-detail-card">
              <span>Anomaly lead</span>
              <strong>{anomalyLead ? `${anomalyLead.date} ${formatCurrency(anomalyLead.amount)}` : "No outlier"}</strong>
              <small>
                {anomalyLead
                  ? `${anomalyLead.category ?? "General"} vs expected ${formatCurrency(anomalyLead.expected)}`
                  : "Threshold stable"}
              </small>
            </article>
            <article className="ts-detail-card">
              <span>Trip daily average</span>
              <strong>{snapshot ? formatCurrency(snapshot.trip.averageDailySpend) : "--"}</strong>
              <small>{snapshot?.trip.tripDays ?? activeScenario.tripDays} day travel horizon</small>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}
