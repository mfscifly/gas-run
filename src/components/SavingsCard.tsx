"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateSavings } from "@/lib/calc";
import { useFxRate } from "@/lib/use-fx";

const TANK_STORAGE_KEY = "gas-tools.tankSizeL";
const DEFAULT_TANK_L = 60;

const inputCls =
  "w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 min-h-12 text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/40";

export type SavingsCardProps = {
  prefillUsdPerGal?: number;
  prefillCadPerL?: number;
  prefillMeta?: { label: string; updatedAt: string };
};

function parse(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function fmt2(n: number | undefined): string {
  return n === undefined ? "" : n.toFixed(2);
}

function fmt3(n: number | undefined): string {
  return n === undefined ? "" : n.toFixed(3);
}

export function SavingsCard({
  prefillUsdPerGal,
  prefillCadPerL,
  prefillMeta,
}: SavingsCardProps) {
  const fx = useFxRate();

  const [tankSize, setTankSize] = useState(String(DEFAULT_TANK_L));
  const [tankUsd, setTankUsd] = useState(fmt2(prefillUsdPerGal));
  const [tankCad, setTankCad] = useState(fmt3(prefillCadPerL));

  useEffect(() => {
    const saved = localStorage.getItem(TANK_STORAGE_KEY);
    // One-time hydration from localStorage; server can't read it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setTankSize(saved);
  }, []);

  useEffect(() => {
    const n = parse(tankSize);
    if (n !== null) localStorage.setItem(TANK_STORAGE_KEY, String(n));
  }, [tankSize]);

  const result = useMemo(() => {
    if (fx.status !== "ready") return null;
    const tank = parse(tankSize) ?? DEFAULT_TANK_L;
    const usd = parse(tankUsd);
    const cad = parse(tankCad);
    if (!usd || !cad) return null;
    return calculateSavings({
      tankSizeL: tank,
      usdPerGal: usd,
      cadPerL: cad,
      fxUsdToCad: fx.usdToCad,
    });
  }, [fx, tankSize, tankUsd, tankCad]);

  let hero: React.ReactNode;
  if (fx.status === "loading") {
    hero = <PlaceholderHero text="Loading exchange rate." />;
  } else if (fx.status === "error") {
    hero = <PlaceholderHero text="Exchange rate unavailable." subtle={fx.message} />;
  } else if (!result) {
    hero = (
      <PlaceholderHero text="Enter both gas prices to see your savings." />
    );
  } else if (result.worthIt) {
    hero = (
      <Hero
        tone="good"
        big={`$${result.savingsCad.toFixed(2)}`}
        subtitle={`saved per ${parse(tankSize) ?? DEFAULT_TANK_L} L tank`}
        kicker="Worth the trip"
      />
    );
  } else {
    hero = (
      <Hero
        tone="bad"
        big={`$${Math.abs(result.savingsCad).toFixed(2)}`}
        subtitle={`more expensive per ${parse(tankSize) ?? DEFAULT_TANK_L} L tank`}
        kicker="Skip the trip"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {hero}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="opacity-80">Tank size (L)</span>
          <input
            type="number"
            inputMode="decimal"
            step="1"
            value={tankSize}
            onChange={(e) => setTankSize(e.target.value)}
            className={inputCls}
            placeholder={String(DEFAULT_TANK_L)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="opacity-80">US price (USD/gal)</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={tankUsd}
            onChange={(e) => setTankUsd(e.target.value)}
            className={inputCls}
            placeholder="3.49"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="opacity-80">Canadian price (CAD/L)</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.001"
            value={tankCad}
            onChange={(e) => setTankCad(e.target.value)}
            className={inputCls}
            placeholder="1.659"
          />
        </label>
      </div>

      {prefillMeta && (
        <p className="text-xs opacity-60">
          Pre-filled with {prefillMeta.label} (updated {prefillMeta.updatedAt}).
          Edit to use your own.
        </p>
      )}
      {fx.status === "ready" && (
        <p className="text-xs opacity-50 tabular-nums">
          Calculated at 1 USD = {fx.usdToCad.toFixed(4)} CAD.
        </p>
      )}
    </div>
  );
}

function Hero({
  tone,
  big,
  subtitle,
  kicker,
}: {
  tone: "good" | "bad";
  big: string;
  subtitle: string;
  kicker: string;
}) {
  const toneCls =
    tone === "good"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  return (
    <div className={`rounded-xl border p-5 sm:p-6 flex flex-col gap-1 ${toneCls}`}>
      <span className="text-xs uppercase tracking-wide opacity-80">
        {kicker}
      </span>
      <span className="text-4xl sm:text-5xl font-semibold tabular-nums leading-none">
        {big}
      </span>
      <span className="text-sm opacity-80">{subtitle}</span>
    </div>
  );
}

function PlaceholderHero({
  text,
  subtle,
}: {
  text: string;
  subtle?: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.03] p-5 sm:p-6 flex flex-col gap-1">
      <span className="text-base opacity-80">{text}</span>
      {subtle && <span className="text-xs opacity-60">{subtle}</span>}
    </div>
  );
}
