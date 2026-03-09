import { useEffect, useMemo, useRef, useState } from "react";
import { config } from "../lib/config";
import type { PriceTick } from "../types";

const defaultSymbols = ["AAPL", "MSFT", "GOOGL", "TSLA"];

function randomWalk(prev: number) {
  const delta = (Math.random() - 0.5) * 1.4;
  return Number(Math.max(prev + delta, 1).toFixed(2));
}

function seedPriceForSymbol(symbol: string) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
  return 50 + (hash % 500);
}

export function useStockStream(symbols: string[] = defaultSymbols) {
  const [ticks, setTicks] = useState<Record<string, PriceTick>>({});
  const fallbackTimer = useRef<number | null>(null);
  const normalizedSymbols = useMemo(
    () => (symbols.length ? symbols.map((symbol) => symbol.toUpperCase()) : defaultSymbols),
    [symbols]
  );

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
  }, [normalizedSymbols]);

  function startFallback() {
    if (fallbackTimer.current) window.clearInterval(fallbackTimer.current);
    fallbackTimer.current = window.setInterval(() => {
      setTicks((old) => {
        const next: Record<string, PriceTick> = { ...old };
        normalizedSymbols.forEach((symbol) => {
          const prev = next[symbol]?.price ?? seedPriceForSymbol(symbol);
          next[symbol] = { symbol, price: randomWalk(prev), ts: Date.now() };
        });
        return next;
      });
    }, 1200);
  }

  return useMemo(
    () =>
      Object.values(ticks)
        .filter((tick) => normalizedSymbols.includes(tick.symbol))
        .sort((a, b) => a.symbol.localeCompare(b.symbol)),
    [normalizedSymbols, ticks]
  );
}
