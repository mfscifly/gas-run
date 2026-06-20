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

function shortestUsBound(crossings: Crossing[], data: WaitsData) {
  let best: number | null = null;
  for (const c of crossings) {
    const w = getCrossingWaits(c, data).usBound;
    const d = w?.delayMin;
    if (typeof d === "number" && (best === null || d < best)) best = d;
  }
  return best;
}

export function ProvinceAccordion({ data }: Props) {
  const grouped = crossingsByProvince();
  return (
    <div className="flex flex-col gap-2">
      {PROVINCE_ORDER.map((p) => (
        <ProvinceRow
          key={p}
          province={p}
          crossings={grouped.get(p) ?? []}
          data={data}
        />
      ))}
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
  const min = shortestUsBound(crossings, data);

  return (
    <details className="group rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.03] open:bg-transparent overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 min-h-14 select-none hover:bg-black/[0.04] dark:hover:bg-white/[0.05] [&::-webkit-details-marker]:hidden">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-base font-semibold leading-tight">
            {PROVINCE_LABELS[province]}
          </span>
          <span className="text-xs opacity-60 tabular-nums">
            {crossings.length} crossing{crossings.length === 1 ? "" : "s"}
            {min !== null && (
              <>
                <span className="mx-1.5 opacity-50">·</span>shortest going {min}m
              </>
            )}
          </span>
        </div>
        <Chevron />
      </summary>
      <ul className="border-t border-black/10 dark:border-white/15 divide-y divide-black/5 dark:divide-white/10">
        {crossings.map((c) => {
          const waits = getCrossingWaits(c, data);
          return (
            <li key={c.slug}>
              <Link
                href={`/crossings/${c.slug}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5 min-h-14 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] active:bg-black/[0.06]"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium leading-tight">
                    {c.name}
                  </span>
                  <span className="truncate text-xs opacity-60">
                    {c.canadianTown} ⇄ {c.americanTown}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <WaitTimeBadge wait={waits.usBound} prefix="→" />
                  <WaitTimeBadge wait={waits.caBound} prefix="←" />
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
