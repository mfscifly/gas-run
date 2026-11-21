import type { LaneStatus, WaitTime } from "@/lib/wait-times";

// The border-wait side of "is the trip worth it": the round trip waits at both
// ports, so the cost is the US-bound lineup plus the Canada-bound one.
export type TripWait = {
  // Sum of the directions that have a posted number, or null if neither does.
  totalMin: number | null;
  // True when exactly one direction has a number, so totalMin is a floor.
  partial: boolean;
  // True when either direction reports the port closed.
  closed: boolean;
};

function usable(w: WaitTime | null): number | null {
  return w && w.status === "open" && typeof w.delayMin === "number"
    ? w.delayMin
    : null;
}

function isClosed(status: LaneStatus | undefined): boolean {
  return status === "closed";
}

export function summarizeTripWait(
  usBound: WaitTime | null,
  caBound: WaitTime | null,
): TripWait {
  const out = usable(usBound);
  const back = usable(caBound);
  const known = [out, back].filter((n): n is number => n !== null);
  return {
    totalMin: known.length ? known.reduce((a, b) => a + b, 0) : null,
    partial: known.length === 1,
    closed: isClosed(usBound?.status) || isClosed(caBound?.status),
  };
}

// "55 minutes", "1 hour 25 minutes". Rounded to 5 minutes, because the feeds
// are coarse and "about 53 minutes" claims a precision they don't have.
export function formatWaitDuration(totalMin: number): string {
  const m = Math.max(5, Math.round(totalMin / 5) * 5);
  const h = Math.floor(m / 60);
  const r = m % 60;
  const hours = h ? `${h} hour${h === 1 ? "" : "s"}` : "";
  const mins = r ? `${r} minutes` : "";
  return [hours, mins].filter(Boolean).join(" ");
}

// Below this many dollars saved per hour of border waiting, a trip that still
// saves money is labelled "Marginal" instead of "Worth the trip". It's a
// judgement call about what an hour in line is worth, so it lives here as one
// plainly named number: change it to move the line for everyone.
export const MARGINAL_CAD_PER_HOUR = 20;

// Savings per hour spent waiting, or null when there's no wait to divide by
// (no lineup, nothing posted, or closed). With a partial wait this is an upper
// bound, since only one direction's minutes are counted.
export function savingsPerHour(savingsCad: number, wait: TripWait): number | null {
  if (wait.closed || wait.totalMin === null || wait.totalMin === 0) return null;
  return savingsCad / (wait.totalMin / 60);
}
