import { useEffect, useMemo, useRef } from "react";
import { createChart, IChartApi, UTCTimestamp } from "lightweight-charts";

function buildCandles() {
  const data: Array<{ time: UTCTimestamp; open: number; high: number; low: number; close: number }> = [];
  let p = 180;
  for (let i = 0; i < 90; i++) {
    const open = p;
    const drift = (Math.random() - 0.5) * 4;
    const close = Math.max(1, open + drift);
    const high = Math.max(open, close) + Math.random() * 1.8;
    const low = Math.min(open, close) - Math.random() * 1.8;
    p = close;
    data.push({
      time: (Math.floor(Date.now() / 1000) - (90 - i) * 86400) as UTCTimestamp,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2))
    });
  }
  return data;
}

function sma(values: number[], period: number) {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const subset = values.slice(i - period + 1, i + 1);
    return subset.reduce((a, b) => a + b, 0) / period;
  });
}

export default function CandleChart() {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candles = useMemo(() => buildCandles(), []);

  useEffect(() => {
    if (!ref.current) return;

    chartRef.current = createChart(ref.current, {
      height: 320,
      layout: { background: { color: "#ffffff" }, textColor: "#5f7388" },
      grid: { vertLines: { color: "#e8f0f7" }, horzLines: { color: "#e8f0f7" } }
    });

    const c = chartRef.current.addCandlestickSeries({
      upColor: "#1f8f5f",
      downColor: "#d45745",
      borderVisible: false,
      wickUpColor: "#1f8f5f",
      wickDownColor: "#d45745"
    });
    c.setData(candles);

    const closes = candles.map((d) => d.close);
    const sma14 = sma(closes, 14);
    const smaSeries = chartRef.current.addLineSeries({ color: "#0a66c2", lineWidth: 2 });
    smaSeries.setData(
      candles
        .map((d, i) => (sma14[i] ? { time: d.time, value: Number(sma14[i]!.toFixed(2)) } : null))
        .filter(Boolean) as Array<{ time: UTCTimestamp; value: number }>
    );

    chartRef.current.timeScale().fitContent();

    return () => chartRef.current?.remove();
  }, [candles]);

  return (
    <div className="card">
      <h3>Advanced Chart (Candles + SMA14)</h3>
      <div ref={ref} />
    </div>
  );
}
