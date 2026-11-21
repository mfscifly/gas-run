import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CROSSINGS,
  PROVINCE_LABELS,
  CA_MARKET_LABELS,
  getCrossing,
} from "@/data/crossings";
import { CA_MARKET_PRICES, US_STATE_PRICES } from "@/data/prices.generated";
import { SavingsCard } from "@/components/SavingsCard";
import { tier, type Tone } from "@/components/WaitTimeBadge";
import {
  getAllWaits,
  getCrossingWaits,
  type CbpWait,
  type WaitTime,
} from "@/lib/wait-times";

export const revalidate = 300;

// Camera hosts serve the current still at a fixed URL, so a browser will reuse
// the frame it cached on the last visit. Bucket a cache-buster to the revalidate
// window: fresh on every regeneration, stable within one.
function withCacheBust(url: string): string {
  const bucket = Math.floor(Date.now() / (revalidate * 1000));
  return `${url}${url.includes("?") ? "&" : "?"}t=${bucket}`;
}

// The subset of Tone that actually reaches a rendered number. "muted" means
// there's no number to colour (closed, or no data), so it never needs an
// entry here; see the tone !== "muted" check in DirectionCard below.
type RenderableTone = Exclude<Tone, "muted">;

// Text-only counterpart to WaitTimeBadge's TONE_CLASSES (which are pill
// styles: background + ring). The big minutes number below needs just the
// colour, tiered by the same shared `tier()` helper.
const TEXT_TONE_CLASSES: Record<RenderableTone, string> = {
  good: "text-emerald-700 dark:text-emerald-300",
  warn: "text-amber-700 dark:text-amber-300",
  bad: "text-rose-700 dark:text-rose-300",
};

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
  const title = `${c.name} | Cross-Border Gas Tools`;
  const description = `Live wait time and savings calculator for the ${c.name} crossing (${c.canadianTown} ⇄ ${c.americanTown}).`;
  // openGraph/twitter are replaced wholesale, not merged, so restate them here
  // or shared links would carry the homepage title. The images come from the
  // sibling opengraph-image / twitter-image files.
  return {
    title,
    description,
    openGraph: { type: "website", siteName: "Cross-Border Gas Tools", title, description, url: `/crossings/${c.slug}` },
    twitter: { card: "summary_large_image", title, description },
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

  const caPrice = CA_MARKET_PRICES[crossing.caMarket];
  const usStatePrice = US_STATE_PRICES[crossing.usState];
  const prefillUpdated = [caPrice.updatedAt, usStatePrice.updatedAt]
    .sort()
    .at(0)!;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-8 sm:py-12">
      <Link
        href="/"
        className="label-mono self-start -ml-1 px-1 py-1 hover:opacity-100 hover:text-accent"
      >
        ← All crossings
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="text-4xl sm:text-5xl font-normal tracking-[-0.035em] leading-[1.05]">
          {crossing.name}
        </h1>
        <p className="text-sm opacity-70">
          {PROVINCE_LABELS[crossing.province]} · {crossing.usState} ·{" "}
          {crossing.canadianTown} ⇄ {crossing.americanTown}
        </p>
        {crossing.notes && (
          <p className="text-xs opacity-60">{crossing.notes}</p>
        )}
      </header>

      <section className="grid gap-px border border-line bg-line sm:grid-cols-2">
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
          <h2 className="label-mono border-t border-foreground pt-3">Live cameras</h2>
          {crossing.cameras.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {crossing.cameras.map((cam) => (
                <figure
                  key={cam.imageUrl}
                  className="panel flex flex-col gap-2 overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={withCacheBust(cam.imageUrl)}
                    alt={cam.label}
                    className="aspect-video w-full bg-surface-muted object-cover"
                    loading="lazy"
                  />
                  <figcaption className="px-3 pb-3 text-xs opacity-70 flex items-center justify-between gap-2">
                    <span className="truncate">{cam.label}</span>
                    <a
                      href={cam.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link shrink-0"
                    >
                      source
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm opacity-70">
                No direct camera feed for this crossing. Browse on either side:
              </p>
              {crossing.cameraSources.length > 0 && (
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {crossing.cameraSources.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="label-mono border-t border-foreground pt-3">
          Is the trip worth it?
        </h2>
        <SavingsCard
          prefillUsdPerGal={usStatePrice.usdPerGal}
          prefillCadPerL={caPrice.cadPerL}
          prefillMeta={{
            label: `${CA_MARKET_LABELS[crossing.caMarket]} + ${crossing.usState} averages`,
            updatedAt: prefillUpdated,
          }}
        />
      </section>

      <footer className="border-t border-line pt-6 text-sm opacity-70">
        <Link
          href={`https://www.gasbuddy.com/gaspricemap?country=usa&search=${encodeURIComponent(crossing.americanTown)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="link"
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
  sourceLabel,
  lanes,
  missingMessage,
}: {
  kicker: string;
  arrow: string;
  wait: WaitTime | null;
  sourceLabel: string;
  lanes: { label: string; value: number | null }[];
  missingMessage: string;
}) {
  const renderedLanes = lanes.filter(
    (l): l is { label: string; value: number } => typeof l.value === "number",
  );
  const { tone } = tier(wait?.delayMin ?? null, wait?.status);

  return (
    <div className="bg-surface p-4 sm:p-5 flex flex-col gap-0.5">
      <span className="label-mono">
        <span aria-hidden className="mr-1">{arrow}</span>
        {kicker}
      </span>
      {wait && tone !== "muted" ? (
        <>
          <span
            className={[
              "text-5xl sm:text-6xl font-normal tracking-[-0.03em] tabular-nums leading-none mt-3",
              TEXT_TONE_CLASSES[tone],
            ].join(" ")}
          >
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
            <span className="font-mono text-[11px] opacity-50 mt-2">
              {sourceLabel} · updated {wait.updateTime}
            </span>
          )}
        </>
      ) : (
        <span className="text-sm opacity-70 mt-0.5">
          {wait?.status === "closed" ? "Closed right now." : missingMessage}
        </span>
      )}
    </div>
  );
}
