import type { WaitTime, LaneStatus } from "@/lib/wait-times";

type Props = {
  wait: WaitTime | null | undefined;
  srLabel?: string;
  className?: string;
};

export type Tone = "good" | "warn" | "bad" | "muted";

// Shared with DirectionCard on the crossing detail page, which colours its
// big minutes number by the same tier instead of duplicating the thresholds.
export function tier(
  min: number | null,
  status: LaneStatus | undefined,
): { label: string; tone: Tone } {
  if (status === "closed") return { label: "Closed", tone: "muted" };
  if (min === null || status === "update-pending")
    return { label: "n/a", tone: "muted" };
  if (min <= 10) return { label: `${min}m`, tone: "good" };
  if (min <= 30) return { label: `${min}m`, tone: "warn" };
  return { label: `${min}m`, tone: "bad" };
}

const TONE_CLASSES = {
  good:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/25",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/25",
  bad: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",
  muted: "bg-surface-muted opacity-70 ring-line",
} as const;

export function WaitTimeBadge({ wait, srLabel, className }: Props) {
  const { label, tone } = tier(wait?.delayMin ?? null, wait?.status);
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 font-mono text-xs font-medium ring-1 ring-inset tabular-nums",
        TONE_CLASSES[tone],
        className ?? "",
      ].join(" ")}
    >
      {srLabel && <span className="sr-only">{srLabel}: {label}</span>}
      <span aria-hidden={Boolean(srLabel)}>{label}</span>
    </span>
  );
}
