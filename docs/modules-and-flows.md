# BreadSaver Modules And Flows

BreadSaver is intentionally scoped to one marketplace loop: bakery lists surplus, customer reserves, inventory decrements, customer gets pickup code, bakery marks pickup complete.

## What We Are Building

### Customer Marketplace
- Browse nearby bakery surplus on the first screen.
- Search by bakery, bread type, or neighborhood.
- Filter by All, Bread, Pastries, and Bundles.
- Switch between list and Mapbox views.
- Open a listing detail with photo, bakery, distance, pickup window, quantity, old/new price, allergens, ingredients, and trust metadata.
- Reserve with simulated payment.
- Receive paid receipt with pickup code, order reference, store address, phone, pickup window, item summary, and savings.

### Bakery Workspace
- Simulated login/logout shell for staff.
- Dashboard metrics: recovered revenue, paid pickups, active inventory.
- Create listing form with title, photo, category, quantity, original price, discount price, pickup window, freshness label, description, ingredients, allergens, and safety confirmation.
- Repeat yesterday action.
- Active listing list.
- Pickup queue with order code and mark picked up action.

### Trust Surface
- Explains surplus wording, bakery confirmation, allergen visibility, pickup-code proof, and no "expired bread" customer positioning.

### Supabase Boundary
- `src/lib/supabaseClient.ts` creates a browser client only when `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` are present.
- The current demo uses local state so it runs without a backend.
- Production should move inventory decrement and order creation into a server-side transaction or Edge Function.

## Deliberately Not Building In This Demo

- Admin dashboard.
- Chat.
- Community feed.
- Recipes.
- Volunteer rescue.
- Delivery.
- Real payment processor.
- Full refund/dispute flow.
- Ratings/reviews.
- Push notifications.
- AI listing copy.

These are cut because they do not improve the first validation question: can a bakery list surplus and can a nearby buyer reserve it with confidence?

## User Flows

### Customer Reserve Flow
1. User opens the app and sees discounted bread nearby.
2. User chooses manual location or keeps default area.
3. User filters/searches.
4. User opens a listing.
5. App blocks reservation if the listing is sold out or expired.
6. User taps Pay and reserve.
7. Demo signs in as a customer if currently guest.
8. Inventory decrements immediately.
9. Order is created with paid status and pickup code.
10. User lands on My pickup receipt.

### Bakery Listing Flow
1. Staff enters Bakery view.
2. If not signed in as staff, staff uses Staff login.
3. Staff fills listing fields or uses Repeat yesterday.
4. Staff must confirm safety.
5. App validates quantity, prices, title, photo, description, and allergens.
6. Listing publishes into the marketplace.

### Pickup Completion Flow
1. Customer shows code from My pickup.
2. Bakery opens Pickup queue.
3. Bakery checks code and taps Mark picked up.
4. Order status becomes picked up and leaves the waiting queue.

### Location Fallback Flow
1. User taps the area selector.
2. User chooses Setapak, Danau Kota, or Campus zone.
3. Results rerender without requiring device permission.

## Core Logic

- A listing is purchasable only when status is `active` and `quantityAvailable > 0`.
- Reserving decrements quantity by one.
- Quantity zero changes listing status to `sold_out`.
- Sold-out listings stay visible for proof but cannot be purchased.
- Safety confirmation is mandatory before publishing.
- Discount price must be below original price.
- Customer UI uses "surplus", "still-good", "end-of-day", "baked today", and "best before"; it does not sell "expired bread."

## Edge Cases

- **Sold out:** Reserve button is disabled and label changes to Unavailable.
- **No results:** User gets a recoverable empty state with area fallback.
- **Guest reserve:** Demo converts guest to simulated customer before creating order.
- **Bakery unauthorized:** Bakery tools are hidden until staff mode is active.
- **Invalid listing:** Form shows toast error and does not publish.
- **Duplicate pickup completion:** Logic rejects completing an already complete order.
- **Report listing:** Listing is flagged locally for admin review.
- **Missing Supabase env:** App remains functional in local demo mode.
- **Missing Mapbox token:** App remains functional and shows a deliberate static map fallback.

## Mapbox Working Definition

Mapbox is considered fully working when:

- `PUBLIC_MAPBOX_TOKEN` renders a real Mapbox GL JS map without breaking list-first browsing.
- The map centers and fits the buyer marker plus every currently visible bakery listing.
- Markers update after search, filters, reservations, sold-out transitions, and area changes.
- Tapping a marker updates the listing preview and keeps Reserve working.
- Returning to map mode resizes the map instead of leaving a blank canvas.
- Missing token or missing WebGL shows a recoverable fallback instead of a blank panel.
- Supabase data keeps bakery `latitude` and `longitude` public-safe, while order creation and inventory decrement stay server-owned in production.

## Problems And Decisions

- **Problem:** Top brand/header cost vertical space and made the app feel like a landing page.
  **Options:** keep top brand, shrink it, or remove it.
  **Decision:** remove it and keep only bottom app navigation.

- **Problem:** Mock maps prove layout but not pickup geography.
  **Options:** keep mock, use static image tiles, use Mapbox GL JS, or use MapLibre.
  **Decision:** use Mapbox GL JS because CampusRide already uses it and it supports markers, popups, fit bounds, and mobile controls.

- **Problem:** Mapbox is a heavy mobile dependency.
  **Options:** eager import, route split, or lazy import on map mode.
  **Decision:** lazy import the JS only when map mode is opened; CSS remains global.

- **Problem:** Production inventory cannot trust browser state.
  **Options:** client-only updates, Supabase row updates, or Edge Function/database transaction.
  **Decision:** demo stays local; production should use a trusted server transaction with RLS-protected reads.

## Mobile Checkpoint

- Platform: mobile web first, responsive desktop second.
- Framework: Astro static app with TypeScript client script.
- Principles applied:
  1. Primary buying CTA stays large and reachable.
  2. List view stays fast by default; map mode becomes a real pickup geography surface when opened.
  3. Manual location fallback prevents a permission dead end.
- Anti-patterns avoided:
  1. No hover-only actions.
  2. No generic decorative gradient/orb UI.
  3. No hidden gesture-only controls.
