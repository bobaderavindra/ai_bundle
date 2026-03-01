import { useMemo, useState } from "react";
import type { StrategyBlock } from "../types";

const palette: StrategyBlock[] = [
  { id: "i-rsi", kind: "INDICATOR", label: "RSI(14)" },
  { id: "i-sma", kind: "INDICATOR", label: "SMA(20)" },
  { id: "c-cross", kind: "CONDITION", label: "Cross Above" },
  { id: "c-thresh", kind: "CONDITION", label: "Greater Than" },
  { id: "a-buy", kind: "ACTION", label: "BUY 10%" },
  { id: "a-sell", kind: "ACTION", label: "SELL 10%" }
];

export default function StrategyBuilder() {
  const [blocks, setBlocks] = useState<StrategyBlock[]>([]);

  const strategyDsl = useMemo(() => blocks.map((b) => b.label).join(" -> "), [blocks]);

  function addBlock(blockId: string) {
    const block = palette.find((x) => x.id === blockId);
    if (!block) return;
    setBlocks((old) => [...old, { ...block, id: `${block.id}-${Date.now()}` }]);
  }

  function onDragStart(e: React.DragEvent<HTMLDivElement>, blockId: string) {
    e.dataTransfer.setData("blockId", blockId);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    addBlock(e.dataTransfer.getData("blockId"));
  }

  return (
    <div className="card">
      <h3>Strategy Builder</h3>
      <div className="builder">
        <div>
          <h4>Palette</h4>
          {palette.map((item) => (
            <div key={item.id} draggable onDragStart={(e) => onDragStart(e, item.id)} className="block">
              {item.kind}: {item.label}
            </div>
          ))}
        </div>
        <div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <h4>Drop Strategy Blocks Here</h4>
          {blocks.map((b) => (
            <div key={b.id} className="block placed">
              {b.kind}: {b.label}
            </div>
          ))}
        </div>
      </div>
      <small>{strategyDsl || "No strategy blocks yet."}</small>
    </div>
  );
}
