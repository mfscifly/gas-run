import Link from "next/link";
import { CROSSINGS, PROVINCE_LABELS, getCrossing } from "@/data/crossings";
import { withCacheBust } from "@/lib/camera";

// A spread of busy crossings that have a direct camera feed. Falls back to any
// crossing with a camera if one of these loses its feed.
const FEATURED = ["peace-arch", "bluewater-bridge", "peace-bridge", "rainbow-bridge"];

function featured() {
  const picks = FEATURED.map(getCrossing).filter(
    (c): c is NonNullable<typeof c> => !!c && c.cameras.length > 0,
  );
  for (const c of CROSSINGS) {
    if (picks.length >= 4) break;
    if (c.cameras.length > 0 && !picks.includes(c)) picks.push(c);
  }
  return picks.slice(0, 4);
}

export function LiveCameras({ revalidateSec }: { revalidateSec: number }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {featured().map((c) => (
        <li key={c.slug}>
          <Link
            href={`/crossings/${c.slug}`}
            className="group relative block aspect-[4/3] overflow-hidden bg-accent/15"
          >
            {/* Empty alt: the caption names the crossing, and a dead feed
                then shows the tinted tile instead of a broken-image icon. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withCacheBust(c.cameras[0].imageUrl, revalidateSec)}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2.5 pb-2 pt-8 text-white">
              <span className="block truncate text-sm font-medium leading-tight">{c.name}</span>
              <span className="block truncate font-mono text-[10px] uppercase tracking-[0.08em] opacity-80">
                {PROVINCE_LABELS[c.province]}
              </span>
            </div>
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Live
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
