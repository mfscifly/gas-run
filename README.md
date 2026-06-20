# Cross-Border Gas Tools

Decide whether the trip across the border is worth it. Convert USD/gal ↔ CAD/L and estimate per-tank savings using a live USD-CAD exchange rate.

Successor to [gastools.netlify.app](https://gastools.netlify.app/).

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
