"use client";

import { useEffect, useState } from "react";

export type FxState =
  | { status: "loading" }
  | { status: "ready"; usdToCad: number; fetchedAt: string }
  | { status: "error"; message: string };

export function useFxRate(): FxState {
  const [fx, setFx] = useState<FxState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/fx")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as { usdToCad: number; fetchedAt: string };
      })
      .then((data) => {
        if (cancelled) return;
        setFx({
          status: "ready",
          usdToCad: data.usdToCad,
          fetchedAt: data.fetchedAt,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFx({
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return fx;
}
