import { useEffect, useMemo, useRef, useState } from "react";
import { config } from "../lib/config";
import type { PriceTick } from "../types";

const symbols = ["AAPL", "MSFT", "GOOGL", "TSLA"];

function randomWalk(prev: number) {
  const delta = (Math.random() - 0.5) * 1.4;
  return Number(Math.max(prev + delta, 1).toFixed(2));
}

export function useStockStream() {
  const [ticks, setTicks] = useState<Record<string, PriceTick>>({});
  const fallbackTimer = useRef<number | null>(null);

  useEffect(() => {
    if (config.stockWsUrl) {
      const ws = new WebSocket(config.stockWsUrl);
      ws.onmessage = (evt) => {
        try {
          const tick = JSON.parse(evt.data) as PriceTick;
          setTicks((old) => ({ ...old, [tick.symbol]: tick }));
        } catch {
          // Ignore malformed message.
        }
      };
      ws.onerror = () => ws.close();
      ws.onclose = startFallback;
      return () => ws.close();
    }

    startFallback();
    return () => {
      if (fallbackTimer.current) window.clearInterval(fallbackTimer.current);
    };
  }, []);

  function startFallback() {
    if (fallbackTimer.current) return;

    const seed: Record<string, number> = {
      AAPL: 186,
      MSFT: 428,
      GOOGL: 172,
      TSLA: 242
    };
    fallbackTimer.current = window.setInterval(() => {
      setTicks((old) => {
        const next: Record<string, PriceTick> = { ...old };
        symbols.forEach((symbol) => {
          const prev = next[symbol]?.price ?? seed[symbol];
          next[symbol] = { symbol, price: randomWalk(prev), ts: Date.now() };
        });
        return next;
      });
    }, 1200);
  }

  return useMemo(() => Object.values(ticks).sort((a, b) => a.symbol.localeCompare(b.symbol)), [ticks]);
}
