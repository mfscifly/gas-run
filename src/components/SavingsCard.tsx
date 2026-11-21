"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateSavings, type SavingsResult } from "@/lib/calc";
import { useFxRate } from "@/lib/use-fx";
import {
  MARGINAL_CAD_PER_HOUR,
  formatWaitDuration,
  savingsPerHour,
  type TripWait,
} from "@/lib/trip-wait";

const TANK_STORAGE_KEY = "gas-tools.tankSizeL";
const DEFAULT_TANK_L = 60;

const inputCls = "field text-base";

export type SavingsCardProps = {
  prefillUsdPerGal?: number;
  prefillCadPerL?: number;
  // Where the pre-filled prices come from, already worded for display, e.g.
  // "Vancouver October average and WA average for the week of Nov 16".
  prefillSource?: string;
  // Live border waits for this crossing, so the verdict weighs time as well
  // as money. Omitted where there's no crossing context.
  tripWait?: TripWait;
};

// One line that puts the money next to the time it costs, e.g.
// "$15 saved, about 55 minutes of waiting. That's about $16 an hour."
export function waitVerdictLine(savingsCad: number, wait: TripWait): string {
  const saved = savingsCad > 0;
  const money = `$${Math.round(Math.abs(savingsCad))} ${saved ? "saved" : "more"}`;
  if (wait.closed) return `${money}, but the crossing is closed in one direction right now.`;
  if (wait.totalMin === null) return `${money}; border wait times aren't posted right now.`;
  if (wait.totalMin === 0) return `${money}, with no wait at the border right now.`;
  const time = `${wait.partial ? "at least" : "about"} ${formatWaitDuration(wait.totalMin)} of waiting`;
  const note = wait.partial ? " (one direction isn't posted)" : "";
  if (!saved) return `${money}, plus ${time}${note}.`;
  const raw = savingsPerHour(savingsCad, wait)!;
  const marginal = raw < MARGINAL_CAD_PER_HOUR;
  // Round, but never up to the line itself: $19.60 must not read "$20 an
  // hour, below our $20 an hour line".
  const perHour = marginal
    ? Math.min(Math.round(raw), MARGINAL_CAD_PER_HOUR - 1)
    : Math.round(raw);
  const line = marginal ? `, below our $${MARGINAL_CAD_PER_HOUR} an hour line` : "";
  return `${money}, ${time}${note}. That's about $${perHour} an hour${line}.`;
}

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
  prefillSource,
  tripWait,
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

  const tankSizeNum = parse(tankSize) ?? DEFAULT_TANK_L;
  const usdNum = parse(tankUsd);
  const cadNum = parse(tankCad);

  const result = useMemo(() => {
    if (fx.status !== "ready") return null;
    if (!usdNum || !cadNum) return null;
    return calculateSavings({
      tankSizeL: tankSizeNum,
      usdPerGal: usdNum,
      cadPerL: cadNum,
      fxUsdToCad: fx.usdToCad,
    });
  }, [fx, tankSizeNum, usdNum, cadNum]);

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
    // Saving money but not much per hour in line: say so in the label too,
    // not only in the line underneath.
    const perHour = tripWait ? savingsPerHour(result.savingsCad, tripWait) : null;
    const marginal = perHour !== null && perHour < MARGINAL_CAD_PER_HOUR;
    hero = (
      <Hero
        tone={marginal ? "warn" : "good"}
        big={`$${result.savingsCad.toFixed(2)}`}
        subtitle={`saved per ${tankSizeNum} L tank`}
        kicker={marginal ? "Marginal" : "Worth the trip"}
        detail={tripWait && waitVerdictLine(result.savingsCad, tripWait)}
      />
    );
  } else {
    hero = (
      <Hero
        tone="bad"
        big={`$${Math.abs(result.savingsCad).toFixed(2)}`}
        subtitle={`more expensive per ${tankSizeNum} L tank`}
        kicker="Skip the trip"
        detail={tripWait && waitVerdictLine(result.savingsCad, tripWait)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {hero}

      {result && fx.status === "ready" && cadNum && usdNum && (
        <Breakdown
          result={result}
          cadPerL={cadNum}
          usdPerGal={usdNum}
          fxRate={fx.usdToCad}
          tankSizeL={tankSizeNum}
        />
      )}

      {prefillSource && (
        <p className="text-xs opacity-60">
          Pre-filled with the {prefillSource}. Edit to use your own.
        </p>
      )}

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
    </div>
  );
}

function Hero({
  tone,
  big,
  subtitle,
  kicker,
  detail,
}: {
  tone: "good" | "warn" | "bad";
  big: string;
  subtitle: string;
  kicker: string;
  detail?: string;
}) {
  const toneCls = {
    good: "border-emerald-600/30 border-l-emerald-600 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300 dark:border-l-emerald-400",
    warn: "border-amber-600/30 border-l-amber-600 bg-amber-500/[0.07] text-amber-800 dark:text-amber-300 dark:border-l-amber-400",
    bad: "border-rose-600/30 border-l-rose-600 bg-rose-500/[0.07] text-rose-700 dark:text-rose-300 dark:border-l-rose-400",
  }[tone];
  return (
    <div className={`border border-l-4 p-5 sm:p-6 flex flex-col gap-2 ${toneCls}`}>
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] opacity-90">
        {kicker}
      </span>
      <span className="text-5xl sm:text-6xl font-normal tracking-[-0.03em] tabular-nums leading-none">
        {big}
      </span>
      <span className="text-sm opacity-80">{subtitle}</span>
      {detail && (
        <span className="mt-2 border-t border-current/20 pt-2 text-sm font-medium">
          {detail}
        </span>
      )}
    </div>
  );
}

function Breakdown({
  result,
  cadPerL,
  usdPerGal,
  fxRate,
  tankSizeL,
}: {
  result: SavingsResult;
  cadPerL: number;
  usdPerGal: number;
  fxRate: number;
  tankSizeL: number;
}) {
  const gapAbs = Math.abs(result.perLitreSavingsCad);
  const totalAbs = Math.abs(result.savingsCad);
  const gapLabel = result.worthIt ? "Gap" : "Extra";
  const gapSuffix = result.worthIt ? "" : " more";
  const gapTone = result.worthIt
    ? "text-emerald-700 dark:text-emerald-300"
    : "text-rose-700 dark:text-rose-300";

  return (
    <div className="panel px-4 py-3 text-sm tabular-nums flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="opacity-70">Canada</span>
        <span>{cadPerL.toFixed(3)} /L</span>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="opacity-70">US</span>
        <span className="text-right">
          {result.cadEquivalentOfUsPrice.toFixed(3)} /L{" "}
          <span className="opacity-60 text-xs">
            (${usdPerGal.toFixed(2)}/gal @ {fxRate.toFixed(4)})
          </span>
        </span>
      </div>
      <div className="border-t border-line my-0.5" />
      <div className={`flex items-baseline justify-between font-medium ${gapTone}`}>
        <span>{gapLabel}</span>
        <span>
          {gapAbs.toFixed(3)} /L &times; {tankSizeL} L = ${totalAbs.toFixed(2)}
          {gapSuffix}
        </span>
      </div>
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
    <div className="panel border-l-4 border-l-line-strong p-5 sm:p-6 flex flex-col gap-1">
      <span className="text-base opacity-80">{text}</span>
      {subtle && <span className="text-xs opacity-60">{subtle}</span>}
    </div>
  );
}
