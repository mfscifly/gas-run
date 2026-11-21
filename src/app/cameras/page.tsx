import type { Metadata } from "next";
import Link from "next/link";
import { BorderScene } from "@/components/BorderScene";
import {
  PROVINCE_LABELS,
  PROVINCE_ORDER,
  crossingsByProvince,
} from "@/data/crossings";
import { withCacheBust } from "@/lib/camera";

export const revalidate = 300;

const title = "Border cameras | Cross-Border Gas Tools";
const description =
  "Live camera stills from Canada-US land crossings, grouped by province, refreshed every 5 minutes.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: "website", siteName: "Cross-Border Gas Tools", title, description, url: "/cameras" },
  twitter: { card: "summary_large_image", title, description },
};

export default function CamerasPage() {
  const grouped = crossingsByProvince();
  const cameraCount = [...grouped.values()]
    .flat()
    .reduce((n, c) => n + c.cameras.length, 0);

  return (
    <>
      <header className="hero-band text-white">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 pt-6 sm:pt-10">
          <Link
            href="/"
            className="label-mono self-start -ml-1 px-1 py-1 opacity-80 hover:opacity-100"
          >
            ← All crossings
          </Link>
          <h1 className="text-4xl sm:text-5xl font-normal tracking-[-0.035em] leading-[1.05]">
            Live at the border
          </h1>
          <p className="max-w-xl text-sm sm:text-base opacity-85">
            {cameraCount} camera stills from the crossings that publish a feed, refreshed every 5
            minutes. Tap a crossing for its wait times and savings.
          </p>
        </div>
        <div className="mt-4 h-24 sm:aspect-[1200/260] sm:h-auto">
          <BorderScene idPrefix="cameras-scene" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-5 py-10 sm:py-14">
        {PROVINCE_ORDER.map((p) => {
          const crossings = grouped.get(p) ?? [];
          const withCams = crossings.filter((c) => c.cameras.length > 0);
          const without = crossings.filter((c) => c.cameras.length === 0);
          if (crossings.length === 0) return null;
          return (
            <section key={p} className="flex flex-col gap-5">
              <header className="section-head">
                <h2 className="text-xl font-medium tracking-tight">{PROVINCE_LABELS[p]}</h2>
              </header>

              {withCams.map((c) => (
                <div key={c.slug} className="flex flex-col gap-2">
                  <Link href={`/crossings/${c.slug}`} className="group self-start">
                    <span className="font-medium group-hover:text-accent">{c.name}</span>
                    <span className="ml-2 text-xs opacity-60">
                      {c.canadianTown} ⇄ {c.americanTown}
                    </span>
                  </Link>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {c.cameras.map((cam) => (
                      <figure key={cam.imageUrl} className="panel overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={withCacheBust(cam.imageUrl, revalidate)}
                          alt={cam.label}
                          loading="lazy"
                          className="aspect-video w-full bg-surface-muted object-cover"
                        />
                        <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs opacity-70">
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
                </div>
              ))}

              {without.length > 0 && (
                <div className="flex flex-col gap-2 text-sm">
                  <span className="label-mono">No direct feed yet</span>
                  <ul className="flex flex-col divide-y divide-line border-y border-line">
                    {without.map((c) => (
                      <li
                        key={c.slug}
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2"
                      >
                        <Link href={`/crossings/${c.slug}`} className="hover:text-accent">
                          {c.name}
                        </Link>
                        <span className="flex flex-wrap gap-x-3 text-xs">
                          {c.cameraSources.map((s) => (
                            <a
                              key={s.url}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link opacity-80"
                            >
                              {s.label}
                            </a>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </main>
    </>
  );
}
