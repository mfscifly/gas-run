# Gas Run

Decide whether the trip across the border is worth it. Convert USD/gal ↔ CAD/L and estimate per-tank savings using a live USD-CAD exchange rate.

Live at [gasrun.netlify.app](https://gasrun.netlify.app/).

## Setup

```bash
cp .env.example .env.local
# fill in EXCHANGE_RATE_API_KEY (https://www.exchangerate-api.com/)
npm install
npm run dev
```

Open http://localhost:3000.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4. See [CLAUDE.md](./CLAUDE.md) for more.

## Data sources

The code is MIT licensed (see [LICENSE](./LICENSE)). The data it pulls in is not
covered by that licence and stays under its publishers' terms:

- **Canadian pump prices:** Statistics Canada, Table 18-10-0001-01, "Monthly
  average retail prices for gasoline and fuel oil, by geography". Adapted from
  Statistics Canada under the
  [Statistics Canada Open Licence](https://www.statcan.gc.ca/en/terms-conditions/open-licence).
  This does not constitute an endorsement by Statistics Canada of this product.
- **US pump prices:** U.S. Energy Information Administration, Weekly Retail
  Gasoline and Diesel Prices. U.S. government work, public domain.
- **US-bound wait times:** U.S. Customs and Border Protection, Border Wait Times
  feed. U.S. government work, public domain.
- **Canada-bound wait times:** Canada Border Services Agency, Border Wait Times,
  under the [Open Government Licence – Canada](https://open.canada.ca/en/open-government-licence-canada).
- **Border camera stills:** linked live from DriveBC, WSDOT and 511NY at view
  time. No images are stored in this repository; each belongs to its agency.
- **Fonts:** Geist, under the SIL Open Font License (`src/assets/fonts/OFL.txt`).
