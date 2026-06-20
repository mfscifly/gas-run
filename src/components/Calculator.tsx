"use client";

import { useEffect, useState } from "react";
import {
  calculateSavings,
  cadPerLToUsdPerGal,
  usdPerGalToCadPerL,
} from "@/lib/calc";

const TANK_STORAGE_KEY = "gas-tools.tankSizeL";
const DEFAULT_TANK_L = 60;

const inputBase =
  "rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 min-h-12 text-base tabular-nums";
const buttonBase =
  "rounded-md bg-foreground text-background px-5 min-h-12 text-base font-medium disabled:opacity-50 active:opacity-80";

type FxState =
  | { status: "loading" }
  | { status: "ready"; usdToCad: number; fetchedAt: string }
  | { status: "error"; message: string };

export type CalculatorPrefill = {
  tankSizeL?: number;
  usdPerGal?: number;
  cadPerL?: number;
};

export type PrefillMeta = {
  label: string;
  updatedAt: string;
};

type Props = {
  prefill?: CalculatorPrefill;
  prefillMeta?: PrefillMeta;
};

function parseNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function fmtTank(n: number | undefined): string {
  return n === undefined ? "" : String(n);
}

function fmtUsd(n: number | undefined): string {
  return n === undefined ? "" : n.toFixed(2);
}

function fmtCad(n: number | undefined): string {
  return n === undefined ? "" : n.toFixed(3);
}

export function Calculator({ prefill, prefillMeta }: Props) {
  const [fx, setFx] = useState<FxState>({ status: "loading" });

  const [usdInput, setUsdInput] = useState("");
  const [cadInput, setCadInput] = useState("");
  const [convertNote, setConvertNote] = useState<string | null>(null);

  const [tankSize, setTankSize] = useState(fmtTank(prefill?.tankSizeL));
  const [tankUsd, setTankUsd] = useState(fmtUsd(prefill?.usdPerGal));
  const [tankCad, setTankCad] = useState(fmtCad(prefill?.cadPerL));
  const [savingsMsg, setSavingsMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/fx")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as { usdToCad: number; fetchedAt: string };
      })
      .then((data) =>
        setFx({ status: "ready", usdToCad: data.usdToCad, fetchedAt: data.fetchedAt }),
      )
      .catch((err: unknown) =>
        setFx({
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        }),
      );
  }, []);

  useEffect(() => {
    if (prefill?.tankSizeL !== undefined) return;
    const saved = localStorage.getItem(TANK_STORAGE_KEY);
    // One-time hydration from localStorage after mount; server can't read it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setTankSize(saved);
  }, [prefill?.tankSizeL]);

  function handleConvert() {
    setConvertNote(null);
    if (fx.status !== "ready") {
      setConvertNote("Exchange rate not loaded yet.");
      return;
    }

    const usd = parseNumber(usdInput);
    const cad = parseNumber(cadInput);

    if (usd && cad) {
      setConvertNote("Enter just one price. Leave the other blank.");
      return;
    }
    if (!usd && !cad) {
      setConvertNote("Enter a price in USD/gal or CAD/L.");
      return;
    }

    if (usd) {
      setCadInput(usdPerGalToCadPerL(usd, fx.usdToCad).toFixed(3));
    } else if (cad) {
      setUsdInput(cadPerLToUsdPerGal(cad, fx.usdToCad).toFixed(3));
    }
  }

  function handleCalculate() {
    setSavingsMsg(null);
    if (fx.status !== "ready") {
      setSavingsMsg("Exchange rate not loaded yet.");
      return;
    }
    const tank = parseNumber(tankSize) ?? DEFAULT_TANK_L;
    const usd = parseNumber(tankUsd);
    const cad = parseNumber(tankCad);
    if (!usd || !cad) {
      setSavingsMsg("Fill in both gas prices.");
      return;
    }
    localStorage.setItem(TANK_STORAGE_KEY, String(tank));
    const result = calculateSavings({
      tankSizeL: tank,
      usdPerGal: usd,
      cadPerL: cad,
      fxUsdToCad: fx.usdToCad,
    });
    if (result.worthIt) {
      setSavingsMsg(`Estimated savings: $${result.savingsCad.toFixed(2)} CAD per fill.`);
    } else {
      setSavingsMsg(
        `Trip not worth it. Fueling in the US would cost $${Math.abs(result.savingsCad).toFixed(2)} CAD more.`,
      );
    }
  }

  const fxBadge =
    fx.status === "loading"
      ? "Loading exchange rate…"
      : fx.status === "error"
        ? `Exchange rate unavailable (${fx.message})`
        : `1 USD = ${fx.usdToCad.toFixed(4)} CAD`;

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-md border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 px-4 py-2 text-sm">
        {fxBadge}
      </div>

      <section className="flex flex-col gap-4">
        <header>
          <h2 className="text-xl font-semibold">Gas price converter</h2>
          <p className="text-sm opacity-80">
            Enter a price on either side and we&apos;ll fill the other in.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span>USD per gallon</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={usdInput}
              onChange={(e) => setUsdInput(e.target.value)}
              className={inputBase}
              placeholder="3.49"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span>CAD per litre</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.001"
              value={cadInput}
              onChange={(e) => setCadInput(e.target.value)}
              className={inputBase}
              placeholder="1.659"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleConvert}
            className={buttonBase}
            disabled={fx.status !== "ready"}
          >
            Convert
          </button>
          {convertNote && <span className="text-sm opacity-80">{convertNote}</span>}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <header>
          <h2 className="text-xl font-semibold">Cross-border savings</h2>
          <p className="text-sm opacity-80">
            How much you&apos;d save filling one tank south of the border.
          </p>
          {prefillMeta && (
            <p className="mt-1 text-xs opacity-70">
              Pre-filled with {prefillMeta.label} (updated {prefillMeta.updatedAt}). Edit to use your own.
            </p>
          )}
        </header>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span>Tank size (L)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={tankSize}
              onChange={(e) => setTankSize(e.target.value)}
              className={inputBase}
              placeholder={String(DEFAULT_TANK_L)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span>US price (USD/gal)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={tankUsd}
              onChange={(e) => setTankUsd(e.target.value)}
              className={inputBase}
              placeholder="3.49"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span>Canadian price (CAD/L)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.001"
              value={tankCad}
              onChange={(e) => setTankCad(e.target.value)}
              className={inputBase}
              placeholder="1.659"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCalculate}
            className={buttonBase}
            disabled={fx.status !== "ready"}
          >
            Calculate
          </button>
          {savingsMsg && <span className="text-sm">{savingsMsg}</span>}
        </div>
      </section>
    </div>
  );
}
