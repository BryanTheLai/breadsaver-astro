---

status: draft

last_reviewed: 2026-06-21

owner: Bryan

project: BreadSaver

scope: Product research, source-backed lessons, roadmap, and references

---

# BreadSaver Research And Roadmap

<!-- Lossless split from former 2026-06-21-breadsaver-requirements-and-goals.md. Original section text preserved verbatim in this folder. -->

## Borrowed Patterns From Existing Products

| Product | Pattern To Copy | Why It Matters | What Not To Copy Blindly |
|---|---|---|---|
| Too Good To Go | Surprise bags, fixed pickup windows, pay in app, show receipt at pickup | Converts surplus into a simple customer action | Surprise bags can feel risky if the bakery item category is too vague |
| Flashfood | Discounted items near best-by date, grocery-style product cards, strong price comparison | Makes value obvious fast | Grocery browsing can become too inventory-heavy for a bakery MVP |
| OLIO | Local surplus redistribution and business pickup workflows | Reinforces local/community angle | Free-sharing marketplace is not the main revenue model here |
| Karma | Restaurants/cafes list surplus food for discounted pickup | Similar merchant workflow | Avoid broad restaurant scope at MVP, stay bakery-specific |
| Malaysia surplus apps such as ReMeal / Value Food / PaperBox | Local proof that surplus-food behavior can be explained in Malaysia | Helps pitch judges believe this is not fictional | Do not assume their traction or exact model without direct validation |

## Screenshot Teardown From `Wastage reducer`

The downloaded screenshots cover Gone Good-style surplus pickup, OLIO-style local sharing, and Geev-style local donation UX. They should influence BreadSaver, but only at the primitive level.

### Copy These Primitives

- **Location first:** current location, manual location choice, and radius matter because inventory is only valuable if pickup is nearby.
- **List and map views:** list is faster for buying, map proves local density and helps users plan pickup.
- **Category chips:** All, Bread & Pastries, Meals, Groceries, Free, Reduced. BreadSaver should start narrower: All, Bread, Pastries, Bundles, Pickup now.
- **Availability sections:** Nearby available now, Most popular, Reduced food, Free food. BreadSaver should use Today, Pickup soon, Best value, Bakeries you saved.
- **Scarcity labels:** 1 left, 2 left, pickup today, collect by time. These make the action concrete.
- **Old price / new price / discount:** visible savings are the whole value prop.
- **Favorites/watchlist:** useful for bakeries and items that appear repeatedly.
- **Redeem code receipt:** paid status, short code, pickup time, map, phone, order items, and total.
- **Store detail row:** address, phone, directions, opening hours, pickup instructions.
- **Ingredients and allergens:** must be visible before purchase.
- **Reviews and seller trust:** rating, order count, report listing, and basic seller profile reduce anxiety.
- **Add flow with photos:** photo first, title, description, item count, pickup times, approximate location.
- **Safe communication/code of conduct:** only needed if chat or community pickup exists. For MVP, use pickup instructions and support, not open chat.

### Do Not Copy These Parts

- Giant marketing phone mockups. BreadSaver should be the real app, full screen.
- Loud novelty display fonts. Food trust needs calmer typography.
- Heavy gradients and decorative donuts/croissants around the UI.
- Community feed, recipes, volunteer rescue slots, and non-food donation tabs in MVP.
- Free marketplace positioning. BreadSaver is primarily paid surplus pickup.
- "Expiration date" as a customer-facing label. Use baked today, pickup by, best before, and bakery safety confirmation.
- Watchlist-only reduced food where the user still has to find and pay at the till. BreadSaver's core promise is reservation certainty.

### Best Combined Product Shape

BreadSaver should combine:

```text
Too Good To Go: reserve and pay before pickup
Flashfood: price comparison and near-date discount cards
OLIO: local radius, free/reduced distinction, impact story
Geev: safe local pickup, seller trust, report flow
```

But the MVP should stay one sentence:

```text
Reserve discounted surplus bread nearby, pick it up during a short window, and prove the order with a code.
```

### Source-Backed Design Lessons

- Too Good To Go's strongest loop is discover -> reserve -> pay in app -> collect during a specified pickup window -> prove reservation in app. Copy this core loop.
- Too Good To Go also uses "Surprise Bags" so stores can package unpredictable surplus. For BreadSaver, start with clear item bundles first, then add surprise bundles after trust is established.
- Flashfood makes savings obvious by showing local grocery deals up to 50% off and allowing checkout in the app. Copy the visible price comparison.
- Karma's merchant terms require merchants to provide item description, ingredients, allergens, price, opening hours, pickup time, and quantity. Copy this as the minimum serious merchant listing standard.
- Food-date wording matters. "Best if Used By" generally communicates quality timing, not safety. BreadSaver should explain date labels plainly and avoid making safety claims that only a regulator or bakery can verify.


## Build Phases

### Phase 0: Spec And Demo Data

- finalize requirements
- define seeded bakery/listing data
- design core screens

### Phase 1: Clickable Product Demo

- responsive web UI
- local state or mock backend
- complete customer and bakery flow
- no real payments

### Phase 2: Real Backend MVP

- auth
- database
- listing CRUD
- order creation
- inventory transactions
- pickup code confirmation

### Phase 3: Real Pilot

- one bakery
- real listings
- manual payment or payment link
- admin monitoring
- pilot report

### Phase 4: Marketplace

- multiple bakeries
- payments
- refunds
- notifications
- analytics
- admin approval

### Phase 5: Community And Rescue Network

- free surplus donations
- volunteer pickup slots
- charity/community partners
- recipes and zero-waste community content
- safe messaging and code-of-conduct enforcement

Only enter this phase if the paid bakery pickup loop works. Otherwise the product becomes a vague community app.

## External References

- Too Good To Go how the app works: https://www.toogoodtogo.com/en-us/how-does-the-app-work
- Too Good To Go pickup flow: https://www.toogoodtogo.com/en-us/how-to-collect-too-good-to-go
- Flashfood discounted near-date groceries: https://www.flashfood.com/
- Flashfood pickup flow: https://help.flashfood.com/hc/en-us/articles/360049204974-How-do-I-use-Flashfood
- OLIO food sharing and business surplus model: https://olioapp.com/en/
- Karma surplus food app: https://karma.life/
- Karma merchant terms: https://karma.life/legal/terms-merchants
- USDA/FDA style guidance on food date labels, "best if used by" is generally quality, not safety: https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/food-product-dating
