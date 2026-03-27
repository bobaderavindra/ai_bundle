import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type {
  AnomalyResponse,
  CreditResponse,
  ForecastResponse,
  PatternResponse,
  ScenarioDefinition,
  TripResponse,
  TimeSeriesSnapshot
} from "../lib/timeSeriesShowcase";

interface UseTimeSeriesShowcaseArgs {
  accessToken?: string;
  scenario: ScenarioDefinition;
  reloadKey: number;
}

export function useTimeSeriesShowcase({ accessToken, scenario, reloadKey }: UseTimeSeriesShowcaseArgs) {
  const [snapshot, setSnapshot] = useState<TimeSeriesSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      if (!accessToken) return;

      setIsLoading(true);
      setError(null);

      try {
        const [forecast, patterns, anomalies, credit, trip] = await Promise.all([
          api<ForecastResponse>(
            "/ml/time-series/forecast",
            {
              method: "POST",
              body: JSON.stringify({
                series: scenario.series,
                periods: 1,
                budgetLimit: scenario.budgetLimit
              })
            },
            accessToken
          ),
          api<PatternResponse>(
            "/ml/time-series/patterns",
            {
              method: "POST",
              body: JSON.stringify({
                series: scenario.series
              })
            },
            accessToken
          ),
          api<AnomalyResponse>(
            "/ml/time-series/anomalies",
            {
              method: "POST",
              body: JSON.stringify({
                series: scenario.series,
                zScoreThreshold: 1.5
              })
            },
            accessToken
          ),
          api<CreditResponse>(
            "/ml/time-series/credit-utilization",
            {
              method: "POST",
              body: JSON.stringify({
                series: scenario.series,
                limitAmount: scenario.creditLimit,
                currentBalance: scenario.currentBalance
              })
            },
            accessToken
          ),
          api<TripResponse>(
            "/ml/time-series/trip-budget",
            {
              method: "POST",
              body: JSON.stringify({
                series: scenario.series,
                tripDays: scenario.tripDays,
                totalBudget: scenario.tripBudget
              })
            },
            accessToken
          )
        ]);

        if (cancelled) return;
        setSnapshot({ forecast, patterns, anomalies, credit, trip });
      } catch (nextError) {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : "Unable to load time-series insights");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [accessToken, reloadKey, scenario]);

  return { snapshot, isLoading, error };
}
