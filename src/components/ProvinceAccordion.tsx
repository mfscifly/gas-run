import Link from "next/link";
import {
  PROVINCE_LABELS,
  PROVINCE_ORDER,
  crossingsByProvince,
  type Crossing,
  type Province,
} from "@/data/crossings";
import { getCrossingWaits, type WaitsData } from "@/lib/wait-times";
import { WaitTimeBadge } from "./WaitTimeBadge";

type Props = {
  data: WaitsData;
};

// The province row summarizes US-bound waits as a range. Showing only the
// shortest wait ("no wait to US") read as "no waits anywhere in BC" while
// another BC crossing sat at 30 minutes.
function summarizeUsBound(
  crossings: Crossing[],
  data: WaitsData,
): { min: number; max: number } | null {
  const posted: number[] = [];
  for (const c of crossings) {
    const w = getCrossingWaits(c, data).usBound;
    if (w?.status === "open" && typeof w.delayMin === "number") posted.push(w.delayMin);
  }
  if (posted.length === 0) return null;
  return { min: Math.min(...posted), max: Math.max(...posted) };
}

function waitText(min: number): string {
  return min === 0 ? "no wait" : `${min} min`;
}

export function ProvinceAccordion({ data }: Props) {
  const grouped = crossingsByProvince();
  return (
    <div className="panel flex flex-col divide-y divide-line">
      {PROVINCE_ORDER.map((p) => (
        <ProvinceRow
          key={p}
          province={p}
          crossings={grouped.get(p) ?? []}
          data={data}
        />
      ))}
      <p className="px-4 py-3 text-xs opacity-60">
        n/a means the border agency isn&apos;t posting a wait for that crossing
        right now. Small ports like Point Roberts don&apos;t always get one posted.
      </p>
    </div>
  );
}

function ProvinceRow({
  province,
  crossings,
  data,
}: {
  province: Province;
  crossings: Crossing[];
  data: WaitsData;
}) {
  const us = summarizeUsBound(crossings, data);
  const spread = us !== null && us.max > us.min;

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 min-h-16 select-none transition-colors hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-base font-medium tracking-tight leading-tight">
            {PROVINCE_LABELS[province]}
          </span>
          <span className="text-xs opacity-60 tabular-nums">
            {crossings.length} crossing{crossings.length === 1 ? "" : "s"}
            {us && (
              <>
                <span className="mx-1.5 opacity-50">·</span>
                {spread ? `to US ${us.min}–${us.max} min` : `to US ${waitText(us.min)}`}
              </>
            )}
          </span>
        </div>
        <Chevron />
      </summary>
      <div
        aria-hidden
        className="label-mono flex items-center justify-end gap-1.5 border-t border-line bg-surface-muted px-4 py-1.5"
      >
        <span className="w-16 text-center">To US</span>
        <span className="w-16 text-center">To CA</span>
      </div>
      <ul className="divide-y divide-line">
        {crossings.map((c) => {
          const waits = getCrossingWaits(c, data);
          return (
            <li key={c.slug}>
              <Link
                href={`/crossings/${c.slug}`}
                className="group/row flex items-center justify-between gap-3 px-4 py-3.5 min-h-14 transition-colors hover:bg-surface-muted active:bg-surface-muted"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium leading-tight group-hover/row:text-accent">
                    {c.name}
                  </span>
                  <span className="truncate text-xs opacity-60">
                    {c.canadianTown} ⇄ {c.americanTown}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-16 flex justify-center">
                    <WaitTimeBadge wait={waits.usBound} srLabel="US-bound wait" />
                  </span>
                  <span className="w-16 flex justify-center">
                    <WaitTimeBadge wait={waits.caBound} srLabel="Canada-bound wait" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 opacity-50 transition-transform group-open:rotate-90"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 5l6 5-6 5" />
    </svg>
  );
}
