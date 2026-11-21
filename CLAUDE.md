# gas-tools

**Gas Run** (user-facing name; repo and Netlify site are still `gas-tools` / `gastools`).
Cross-border gas price + savings tool. Successor to gastools.netlify.app.

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind v4 (`@import "tailwindcss"` in `globals.css`)
- Deployed to Netlify at https://gastools.netlify.app (took over the site that
  used to build from `sumas-prairie-gas-calculator`, which is now private)

## Structure
- `src/app/page.tsx` — homepage: header + `<ProvinceAccordion />` + `<PriceConverter />` (server-fetches both wait-time feeds)
- `src/app/crossings/[slug]/page.tsx` — per-crossing detail: both direction cards + cameras + `<SavingsCard />`
- `src/app/crossings/[slug]/not-found.tsx` — 404 for unknown slug
- `src/app/layout.tsx` — root layout, metadata, viewport (mobile-safe-area), fonts
- `src/app/api/fx/route.ts` — server route: returns `{ usdToCad, fetchedAt }` from ExchangeRate-API
- `src/components/PriceConverter.tsx` — client component; USD/gal ↔ CAD/L converter
- `src/components/SavingsCard.tsx` — client component; live savings hero, prefilled per crossing
- `src/components/Calculator.tsx` — **dead code.** The v2 combined converter + savings
  component, superseded by `PriceConverter` + `SavingsCard`. Imported nowhere; safe to delete.
- `src/app/globals.css` — theme tokens (light/dark) + shared `panel`, `field`, `label-mono`, `link` utilities.
  Editorial look: hairlines, square corners, mono labels, border-blue brand (`--accent`, `--hero`)
  with sun-yellow highlights inside blue areas; green/amber/rose are reserved for wait-time and savings tones.
- `src/components/BorderScene.tsx` — flat SVG border scene used in the blue hero bands and the share cards
- `src/components/LiveCameras.tsx` — homepage "Live at the border" strip of camera stills (`src/lib/camera.ts` cache-busts them)
- `src/app/icon.svg`, `src/app/apple-icon.tsx` — favicon + iOS icon (brand mark hardcoded; keep in sync with `Logo.tsx`)
- `src/app/opengraph-image.tsx`, `twitter-image.tsx` (+ per-crossing copies under `crossings/[slug]/`) —
  link-preview cards, rendered by `src/lib/og.tsx` with the Geist woff files in `src/assets/fonts/`
  (Latin subset only, so keep card text free of symbols like ⇄)
- `src/components/Logo.tsx` — brand mark used in the site header (layout.tsx), which also holds the "Built by Daniel" footer
- `src/components/ProvinceAccordion.tsx` — server component; native `<details>`/`<summary>` accordion grouped by province
- `src/components/WaitTimeBadge.tsx` — colored pill (green/amber/red/muted); renders "Closed" for closed ports
- `src/lib/calc.ts` — pure conversion + savings math
- `src/lib/use-fx.ts` — client hook wrapping `/api/fx`
- `src/lib/wait-times.ts` — CBP XML + CBSA CSV fetchers/parsers, 5-min revalidate
- `src/data/crossings.ts` — 22 curated crossings (each naming its `caMarket`) + helpers
- `src/data/prices.generated.ts` — price defaults, written whole by `scripts/refresh-prices.py`
- `scripts/refresh-prices.py` — regenerates the price defaults from StatCan + EIA
- `.github/workflows/refresh-prices.yml` — runs that script weekly; commits routine changes straight to main, routes moves over 15% to a rolling `prices/review` PR
- `legacy/` — original vanilla HTML/JS site (gitignored, kept locally for reference)

## Env
- `EXCHANGE_RATE_API_KEY` — required by `/api/fx`. See `.env.example`. Set in the
  Netlify UI as a secret env var, so it is write-only there. Note `.env.local`
  on a dev machine may still hold the old pre-rotation key.

## Commands
- `npm run dev` — start dev server on http://localhost:3000
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint`
- `python3 scripts/refresh-prices.py` — rewrite price defaults from live sources
- `python3 scripts/refresh-prices.py --check` — exit 1 if the defaults are stale

## Roadmap
- v2: port calculator + FX rate, Tailwind UI, key off the client. **DONE**
- v3: curated crossings, accordion-by-province homepage, per-crossing detail pages, mobile-first layout. **DONE**
- v4 (current): CBSA CA-bound wait times **DONE**; automated price feeds from
  StatCan + EIA **DONE**; per-crossing price markets **DONE**; still open:
  geolocation-based "closest crossings", map view, more crossing cameras.
- v5: ad slots for local stations + cross-border PO box services per crossing.

## Adding/editing crossings
All crossings live in `src/data/crossings.ts`. Each entry needs a CBP `port_number`
(look it up at https://bwt.cbp.gov/xml/bwt.xml) for US-bound wait times and a
`cbsaOffice` matching the "Customs Office" column of the CBSA CSV for Canada-bound.
Either can be `null` and the UI degrades gracefully. Cameras are optional `Camera[]`
items pointing at direct image URLs. The curated set was chosen for population
proximity / gas-tourism relevance; not every CBP-tracked port is included.

## Prices
`CA_MARKET_PRICES` and `US_STATE_PRICES` live in `src/data/prices.generated.ts`,
which is **generated, not hand-edited**; the script overwrites the whole file. Run
`scripts/refresh-prices.py` instead. Sources are free and keyless:
- Canada: StatCan table 18-10-0001, monthly, regular unleaded self serve, by city.
  Keyed by `CaMarket` (the surveyed city), not by province. Each crossing names
  its market via `Crossing.caMarket`, so Ontario's three surveyed markets
  (Toronto, Thunder Bay, Ottawa-Gatineau) are no longer flattened into one.
- US: EIA weekly retail (`pswrgvwall.xls`, sheet "Data 3"), regular, all formulations.

## Gotchas
- **Prices are regional averages, not station prices.** The Canadian side is in
  decent shape: measured spread across all three Ontario markets is only ~7c/L
  ($4.20 a tank), and BC and QC crossings all sit close to their surveyed city.
- **The largest remaining price error is the US PADD fallback, not Canada.** EIA
  publishes only 9 states weekly and just WA, MN and NY are ours; MT, ND, MI, VT,
  NH and ME use their PADD region. PADD 2 (Midwest, used for ND and MI) is the
  worst: Chicago sits ~12c/L CAD above the regional average, about $7 a tank,
  which is larger than the entire Ontario market spread. This matters because 4
  of the 9 Ontario crossings pair with Michigan. Michigan, North Dakota, Montana,
  Vermont, Maine and New Hampshire appear in **no** EIA weekly series, so fixing
  this needs a different source, not a different query.
- **DriveBC camera URLs died once already.** `images.drivebc.ca/bchighwaycam/...`
  still answers 200 with a valid JPEG, but every id returns the same "no longer
  available" placeholder, so a dead feed looks fine in the UI. Current source is
  `www.drivebc.ca/images/<id>.jpg`; resolve ids via `www.drivebc.ca/api/webcams/`.
  If cameras ever look wrong, compare image checksums across ids before trusting
  an HTTP 200.
- CBSA feed values seen so far: `""`, `--`, `No Delay`, `N minutes`,
  `Not Applicable`, `Temporarily closed`. Anything unrecognized becomes
  `update-pending`, which renders as "unavailable", so check the feed before
  assuming a parser bug.
- CBP feed doesn't track every land crossing — North Portal SK has a null
  `cbpPortNumber` and shows Canada-bound only. Verify port numbers in the live
  feed before adding entries.
- No public GasBuddy API, so per-station pricing remains unsolved.
- Next.js 16 caching: `cacheComponents` is opt-in; we use plain
  `fetch({ next: { revalidate } })`, which works without it.
