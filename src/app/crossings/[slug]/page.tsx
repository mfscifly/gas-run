import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CROSSINGS,
  PROVINCE_LABELS,
  PROVINCE_PRICES,
  US_STATE_PRICES,
  getCrossing,
} from "@/data/crossings";
import { SavingsCard } from "@/components/SavingsCard";
import { WaitTimeBadge } from "@/components/WaitTimeBadge";
import {
  getAllWaits,
  getCrossingWaits,
  type CbpWait,
  type WaitTime,
} from "@/lib/wait-times";

export const revalidate = 300;

export function generateStaticParams() {
  return CROSSINGS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getCrossing(slug);
  if (!c) return { title: "Crossing not found" };
  return {
    title: `${c.name} | Cross-Border Gas Tools`,
    description: `Live wait time and savings calculator for the ${c.name} crossing (${c.canadianTown} ⇄ ${c.americanTown}).`,
  };
}

export default async function CrossingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const crossing = getCrossing(slug);
  if (!crossing) notFound();

  const waitsData = await getAllWaits();
  const { usBound, caBound } = getCrossingWaits(crossing, waitsData);

  const provincePrice = PROVINCE_PRICES[crossing.province];
  const usStatePrice = US_STATE_PRICES[crossing.usState];
  const prefillUpdated = [provincePrice.updatedAt, usStatePrice.updatedAt]
    .sort()
    .at(0)!;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-6 sm:py-12">
      <Link
        href="/"
        className="self-start text-sm opacity-70 hover:opacity-100 active:opacity-100 -ml-1 px-1 py-1"
      >
        ← All crossings
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {crossing.name}
        </h1>
        <p className="text-sm opacity-80">
          {PROVINCE_LABELS[crossing.province]} · {crossing.usState} ·{" "}
          {crossing.canadianTown} ⇄ {crossing.americanTown}
        </p>
        {crossing.notes && (
          <p className="text-xs opacity-60">{crossing.notes}</p>
        )}
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <UsBoundCard
          wait={usBound}
          tracked={crossing.cbpPortNumber !== null}
        />
        <CaBoundCard
          wait={caBound}
          tracked={crossing.cbsaOffice !== null}
        />
      </section>

      {(crossing.cameras.length > 0 || crossing.cameraSources.length > 0) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs uppercase tracking-wide opacity-70">Live cameras</h2>
          {crossing.cameras.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {crossing.cameras.map((cam) => (
                <figure
                  key={cam.imageUrl}
                  className="flex flex-col gap-2 rounded-xl overflow-hidden border border-black/10 dark:border-white/15"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cam.imageUrl}
                    alt={cam.label}
                    className="aspect-video w-full bg-black/5 dark:bg-white/5 object-cover"
                    loading="lazy"
                  />
                  <figcaption className="px-3 pb-3 text-xs opacity-70 flex items-center justify-between gap-2">
                    <span className="truncate">{cam.label}</span>
                    <a
                      href={cam.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline shrink-0"
                    >
                      source
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-sm opacity-70">
              No direct camera feed for this crossing. Browse on either side:
            </p>
          )}
          {crossing.cameraSources.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {crossing.cameraSources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline opacity-80 hover:opacity-100"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xs uppercase tracking-wide opacity-70">
          Is the trip worth it?
        </h2>
        <SavingsCard
          prefillUsdPerGal={usStatePrice.usdPerGal}
          prefillCadPerL={provincePrice.cadPerL}
          prefillMeta={{
            label: `${PROVINCE_LABELS[crossing.province]} + ${crossing.usState} averages`,
            updatedAt: prefillUpdated,
          }}
        />
      </section>

      <footer className="border-t border-black/10 dark:border-white/15 pt-6 text-sm opacity-70">
        <Link
          href={`https://www.gasbuddy.com/gaspricemap?country=usa&search=${encodeURIComponent(crossing.americanTown)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Live US gas prices near {crossing.americanTown} (GasBuddy)
        </Link>
      </footer>
    </main>
  );
}

function UsBoundCard({
  wait,
  tracked,
}: {
  wait: CbpWait | null;
  tracked: boolean;
}) {
  return (
    <DirectionCard
      kicker="Going (US-bound)"
      arrow="→"
      wait={wait}
      tracked={tracked}
      sourceLabel="CBP"
      lanes={
        wait
          ? [
              { label: "NEXUS / SENTRI", value: wait.nexusDelayMin },
              { label: "Ready", value: wait.readyLanesDelayMin },
            ]
          : []
      }
      missingMessage={
        tracked
          ? "Wait time unavailable right now."
          : "Not tracked in the CBP feed."
      }
    />
  );
}

function CaBoundCard({
  wait,
  tracked,
}: {
  wait: WaitTime | null;
  tracked: boolean;
}) {
  return (
    <DirectionCard
      kicker="Returning (Canada-bound)"
      arrow="←"
      wait={wait}
      tracked={tracked}
      sourceLabel="CBSA"
      lanes={[]}
      missingMessage={
        tracked
          ? "Wait time unavailable right now."
          : "Not tracked in the CBSA feed."
      }
    />
  );
}

function DirectionCard({
  kicker,
  arrow,
  wait,
  tracked,
  sourceLabel,
  lanes,
  missingMessage,
}: {
  kicker: string;
  arrow: string;
  wait: WaitTime | null;
  tracked: boolean;
  sourceLabel: string;
  lanes: { label: string; value: number | null }[];
  missingMessage: string;
}) {
  const hasNumber = wait?.delayMin !== null && wait?.delayMin !== undefined;
  const renderedLanes = lanes.filter(
    (l): l is { label: string; value: number } => typeof l.value === "number",
  );

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/15 p-4 sm:p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-wide opacity-70">
          <span aria-hidden className="mr-1">{arrow}</span>
          {kicker}
        </span>
        <WaitTimeBadge wait={wait} />
      </div>
      {hasNumber && wait ? (
        <>
          <span className="text-4xl sm:text-5xl font-semibold tabular-nums leading-none mt-1">
            {wait.delayMin}
            <span className="ml-1 text-base font-normal opacity-70">min</span>
          </span>
          {renderedLanes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-80 tabular-nums">
              {renderedLanes.map((it) => (
                <span key={it.label}>
                  {it.label}:{" "}
                  <span className="font-medium">{it.value}m</span>
                </span>
              ))}
            </div>
          )}
          {wait.updateTime && (
            <span className="text-[11px] opacity-50 mt-1">
              {sourceLabel} · updated {wait.updateTime}
            </span>
          )}
        </>
      ) : (
        <span className="text-sm opacity-70 mt-0.5">
          {tracked ? missingMessage : missingMessage}
        </span>
      )}
    </div>
  );
}
