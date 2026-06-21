# BreadSaver Astro Demo

Mobile-first Astro prototype for discounted bakery surplus pickup.

## Run

```sh
npm install
npm run dev
```

Local demo URL defaults to `http://localhost:4321`.

## What Works

- Customer browse, search, filters, list/Mapbox toggle, and missing-token map fallback.
- Listing detail with price comparison, pickup window, trust, ingredients, and allergens.
- Simulated payment/reservation with inventory decrement and pickup code receipt.
- Simulated buyer session during checkout and bakery staff login.
- Bakery listing creation, repeat yesterday, active listings, pickup queue, and mark picked up.
- Supabase-ready client boundary through `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Mapbox GL JS map through `PUBLIC_MAPBOX_TOKEN`; use a public `pk.*` token only.

## Files

- `src/pages/index.astro` - app shell and screen containers.
- `src/scripts/app.ts` - local demo state, rendering, and user-flow logic.
- `src/lib/marketplace.ts` - pure marketplace rules.
- `src/lib/seed.ts` - seeded bakeries/listings.
- `src/lib/supabaseClient.ts` - browser-safe Supabase client wrapper.
- `docs/modules-and-flows.md` - scope, flows, edge cases, and overbuild cuts.
- `supabase/schema.sql` - production schema/RLS sketch.

## Verify

```sh
npx astro check
npm run build
```
