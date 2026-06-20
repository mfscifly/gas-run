# gas-tools

Cross-border gas price + savings tool. Successor to gastools.netlify.app.

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind v4 (`@import "tailwindcss"` in `globals.css`)
- Deployed to Netlify (replaces existing `sumas-prairie-gas-calculator` deploy)

## Structure
- `src/app/page.tsx` — homepage: header + `<Calculator />` + `<ProvinceAccordion />` (server-fetches CBP wait times)
- `src/app/crossings/[slug]/page.tsx` — per-crossing detail: wait time card + cameras + prefilled `<Calculator />`
- `src/app/crossings/[slug]/not-found.tsx` — 404 for unknown slug
- `src/app/layout.tsx` — root layout, metadata, viewport (mobile-safe-area), fonts
- `src/app/api/fx/route.ts` — server route: returns `{ usdToCad, fetchedAt }` from ExchangeRate-API
- `src/components/Calculator.tsx` — client component; price converter + savings calc; accepts optional `prefill` + `prefillMeta` props
- `src/components/ProvinceAccordion.tsx` — server component; native `<details>`/`<summary>` accordion grouped by province
- `src/components/WaitTimeBadge.tsx` — colored pill (green/amber/red/muted) based on standard-lane delay minutes
- `src/lib/calc.ts` — pure conversion + savings math
- `src/lib/wait-times.ts` — CBP XML feed fetcher + parser, 5-min revalidate, returns `Map<portNumber, WaitTime>`
- `src/data/crossings.ts` — curated list of ~22 crossings + per-province/state default gas prices + helpers
- `legacy/` — original vanilla HTML/JS site cloned from `mfscifly/sumas-prairie-gas-calculator` (gitignored, kept locally for reference)

## Env
- `EXCHANGE_RATE_API_KEY` — required by `/api/fx`. See `.env.example`.

## Commands
- `npm run dev` — start dev server on http://localhost:3000
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint`

## Roadmap
- v2: port calculator + FX rate, Tailwind UI, key off the client. **DONE**
- v3 (current): curated 22 crossings, accordion-by-province homepage, per-crossing detail pages with CBP US-bound wait times, mobile-first layout, prefilled per-crossing calculator. **DONE**
- v4: CBSA CA-bound wait times (return trip), real price feeds (StatsCan / AAA) replacing the hand-curated `PROVINCE_PRICES`/`US_STATE_PRICES` defaults, geolocation-based "closest crossings", map view, more crossing cameras.
- v5: ad slots for local stations + cross-border PO box services per crossing.

## Adding/editing crossings
All crossings live in `src/data/crossings.ts`. Each entry needs a CBP `port_number` (look it up at https://bwt.cbp.gov/xml/bwt.xml) for live wait times — set to `null` if unavailable and the UI will degrade gracefully. Cameras are optional `Camera[]` items pointing at direct `.jpg` URLs. The currently-curated set was chosen for population proximity / gas-tourism relevance; not every CBP-tracked port is included.

## Gotchas
- The ExchangeRate-API key in the original repo is publicly exposed — rotate before going live.
- No public GasBuddy API; live gas prices remain a v4+ open question. The per-crossing calculator currently prefills with hand-curated province/state averages from `crossings.ts` (refresh manually).
- Next.js 16 caching: `cacheComponents` is opt-in; we currently use plain `fetch({ next: { revalidate } })` which works without it.
- CBP feed (`bwt.cbp.gov/xml/bwt.xml`) doesn't track every land crossing — Portal/North Portal SK is in our curated list but `cbpPortNumber` is null; UI shows "not currently tracked" gracefully. Verify port numbers in the live feed before adding new entries.
