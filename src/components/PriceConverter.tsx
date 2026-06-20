"use client";

import { useState } from "react";
import {
  cadPerLToUsdPerGal,
  usdPerGalToCadPerL,
} from "@/lib/calc";
import { useFxRate } from "@/lib/use-fx";

const inputCls =
  "w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 min-h-12 text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/40";

type Side = "usd" | "cad";

function parse(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function PriceConverter() {
  const fx = useFxRate();
  const [usd, setUsd] = useState("");
  const [cad, setCad] = useState("");
  const [edited, setEdited] = useState<Side | null>(null);

  function onUsdChange(v: string) {
    setEdited("usd");
    setUsd(v);
    const n = parse(v);
    if (fx.status === "ready" && n !== null) {
      setCad(usdPerGalToCadPerL(n, fx.usdToCad).toFixed(3));
    } else if (n === null) {
      setCad("");
    }
  }

  function onCadChange(v: string) {
    setEdited("cad");
    setCad(v);
    const n = parse(v);
    if (fx.status === "ready" && n !== null) {
      setUsd(cadPerLToUsdPerGal(n, fx.usdToCad).toFixed(3));
    } else if (n === null) {
      setUsd("");
    }
  }

  const fxLine =
    fx.status === "ready"
      ? `1 USD = ${fx.usdToCad.toFixed(4)} CAD`
      : fx.status === "loading"
        ? "Loading exchange rate."
        : `Exchange rate unavailable (${fx.message}).`;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="opacity-80">USD per gallon</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={usd}
            onChange={(e) => onUsdChange(e.target.value)}
            className={inputCls}
            placeholder="3.49"
            disabled={fx.status !== "ready"}
            aria-busy={edited === "cad" ? false : undefined}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="opacity-80">CAD per litre</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.001"
            value={cad}
            onChange={(e) => onCadChange(e.target.value)}
            className={inputCls}
            placeholder="1.659"
            disabled={fx.status !== "ready"}
          />
        </label>
      </div>
      <p className="text-xs opacity-60 tabular-nums">{fxLine}</p>
    </div>
  );
}
