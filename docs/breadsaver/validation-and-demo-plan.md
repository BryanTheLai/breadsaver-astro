---

status: draft

last_reviewed: 2026-06-21

owner: Bryan

project: BreadSaver

scope: Demo scope, validation plan, metrics, risks, acceptance criteria, and open questions

---

# BreadSaver Validation And Demo Plan

<!-- Lossless split from former 2026-06-21-breadsaver-requirements-and-goals.md. Original section text preserved verbatim in this folder. -->

## Demo Build Scope

### MVP Demo Must Include

- seeded bakeries
- seeded listings
- browse screen
- list/map toggle with selected listing preview
- manual location/radius selector
- listing detail screen
- reserve/payment simulation
- order confirmation with pickup code
- paid receipt with map/address/phone/items/savings
- bakery dashboard
- create listing form
- pickup queue
- state changes after reservation
- trust/FAQ content for food safety wording
- realistic seeded food photos or high-quality placeholders
- favorite/watchlist action
- report listing action

### MVP Demo Can Fake

- payment processor
- auth
- real geolocation
- real bakery approval
- email/SMS notification
- admin refund operations
- real merchant onboarding documents
- real map provider, if a static/mock map is sufficient for pitch

### MVP Demo Must Not Fake

- inventory decrement
- sold-out state
- expired pickup window behavior
- order status lifecycle
- bakery listing creation
- pickup code confirmation
- empty, loading, sold-out, and missed-pickup states
- location permission denied fallback

## Demo Script For Judges

1. Open the customer app. The first screen already shows discounted bread nearby.
2. Toggle map view to show there is nearby supply, then return to list view.
3. Select "Sourdough end-of-day bundle."
4. Show the value: RM6 today, was RM14, -57%, pickup 6:30-8:00 PM, 3 left.
5. Show trust details: bakery rating, baked today, allergens, report action.
6. Reserve it and simulate payment.
7. Show the paid receipt: pickup code, address, phone, map, items, savings.
8. Switch to bakery mode.
9. Show the order in the pickup queue.
10. Mark the order picked up.
11. Create a new listing using "repeat yesterday."
12. Show the pitch metric: units rescued, revenue recovered, pickup completion.

The demo should make the business obvious without a narrator. A judge should understand the marketplace loop by watching the screens for 30 seconds.

## Validation Plan

### Bakery Interviews

Ask:
- What happens to unsold bread today?
- How often does surplus happen?
- What do you do with it now?
- Who decides discounts?
- How late can customers pick up?
- Would you hold paid orders?
- What would make this annoying for staff?
- Would this bring useful foot traffic or bad customers?
- What margin is acceptable on surplus?

Artifact to collect:
- photo of surplus/end-of-day shelf
- current discount policy
- manual wastage log if any
- closing workflow notes

### Customer Interviews

Ask:
- Would you buy discounted bread if pickup was nearby?
- What discount makes it worth walking there?
- What makes you worry about safety?
- Would you pay before pickup?
- What pickup window is acceptable?
- Do you prefer exact items or surprise bundles?

Artifact to collect:
- preferred pickup times
- target price range
- most trusted wording
- willingness to share location

### Pilot Test

Run one evening with one bakery:
1. list 3-5 surplus items
2. share link to nearby students/residents
3. track views, reservations, pickups, no-shows
4. ask bakery whether workflow was easier than current option
5. ask customers whether they would use it again

## Success Metrics

### Marketplace Metrics

| Metric | Why It Matters | MVP Target |
|---|---|---|
| Listing sell-through rate | Proves demand for surplus | 50%+ in pilot |
| Pickup completion rate | Proves reservation reliability | 80%+ |
| Time to list | Proves bakery workflow is light | Under 30 seconds |
| Customer repeat intent | Proves more than novelty | 50%+ say yes |
| Bakery repeat intent | Proves supply-side pull | 1 bakery asks to run again |
| Waste avoided estimate | Pitch and impact metric | Track units sold from surplus |
| Saved/favorite rate | Shows repeat bakery demand | 20%+ of buyers save a bakery |
| Report rate | Detects trust and supply issues | Track manually in pilot |

### Product Quality Metrics

| Metric | Target |
|---|---|
| Customer can reserve from home screen | Under 90 seconds |
| Bakery can create listing | Under 30 seconds |
| Oversell bug count | Zero |
| Expired listing visible in browse | Zero |
| Confusing "expired" UI wording | Zero |
| Location permission denied dead end | Zero |
| Pickup receipt missing code/address/phone/items | Zero |

## Risks And Mitigations

| Risk | Why It Matters | Mitigation |
|---|---|---|
| Users think food is unsafe | Kills trust immediately | Use baked-today, best-before, safety confirmation, allergen notes |
| Bakeries find listing too much work | No supply | Repeat listings, presets, under-30-second flow |
| Users no-show | Bakery loses chance to sell | Upfront payment, no automatic refund after missed pickup |
| Overselling | Customer arrives angry | Atomic inventory decrement |
| Marketplace starts empty | No demand loop | Start with one campus/area and one bakery |
| Too many categories | Weak positioning | Bakery-only MVP |
| Food safety/legal ambiguity | Real liability | Require local compliance review before production |
| Surprise bags disappoint users | Bad reviews | Start with clear item bundles, add surprise bags later |
| Map becomes the product | Slows MVP and distracts from buying | Use map as discovery proof, list as primary purchase flow |
| Chat creates moderation burden | Safety and complexity | Use pickup instructions/support first, open chat later only if needed |
| Free/community features dilute revenue model | Confuses buyer and merchant | Keep free/volunteer/community as future phase |


## Acceptance Criteria For The First App

The first version is done when:

- A customer can open the app and understand in 3 seconds that discounted bakery surplus is available nearby.
- Location can be enabled or manually selected without a dead end.
- Customer can switch between list and map views.
- A customer can reserve bread, see price savings, and receive a pickup code.
- Order confirmation includes paid status, pickup code, map/directions, store phone, item summary, and total savings.
- A bakery can create a listing without reading instructions.
- Inventory updates after purchase.
- Sold-out and expired listings cannot be purchased.
- The UI avoids generic AI styling and looks like a real consumer marketplace.
- The app works on mobile and desktop.
- The docs folder contains this spec.
- The demo can be shown end-to-end without explaining missing screens.
- The words "expired bread" do not appear in customer-facing UI.


## Open Questions

These should be answered through interviews or pilot, not internal guessing:

- Do customers prefer exact bread items or surprise bundles?
- What discount is enough to change behavior?
- Are bakeries comfortable with prepaid reservations?
- Do bakeries already discount before close?
- Is pickup window strict or flexible?
- What local safety wording is legally safest?
- Should the first wedge be campus bakeries, neighborhood bakeries, or mall bakeries?
