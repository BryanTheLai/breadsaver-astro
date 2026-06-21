import type { AppState, Bakery, Listing, Order } from "./types";

export function money(value: number): string {
  return `RM${value.toFixed(0)}`;
}

export function discountPercent(listing: Listing): number {
  return Math.round(((listing.originalPrice - listing.discountedPrice) / listing.originalPrice) * 100);
}

export function findBakery(state: AppState, bakeryId: string): Bakery {
  const bakery = state.bakeries.find((item) => item.id === bakeryId);
  if (!bakery) throw new Error(`Missing bakery ${bakeryId}`);
  return bakery;
}

export function isPurchasable(listing: Listing): boolean {
  return listing.status === "active" && listing.quantityAvailable > 0;
}

export function visibleListings(state: AppState): Listing[] {
  const query = state.searchQuery.trim().toLowerCase();

  return state.listings.filter((listing) => {
    const bakery = findBakery(state, listing.bakeryId);
    const searchable = [listing.title, listing.category, bakery.name, bakery.area].join(" ").toLowerCase();
    const matchesQuery = query.length === 0 || searchable.includes(query);
    const matchesRadius = bakery.distanceKm <= state.radiusKm;
    const matchesFilter =
      state.activeFilter === "all" ||
      listing.category === state.activeFilter ||
      (state.activeFilter === "cheap" && listing.discountedPrice < 10) ||
      (state.activeFilter === "soon" && listing.pickupEndMinutes <= 20 * 60);

    return matchesQuery && matchesRadius && matchesFilter && listing.status !== "expired";
  });
}

export function reserveListing(state: AppState, listingId: string): Order {
  const listing = state.listings.find((item) => item.id === listingId);
  if (!listing) throw new Error("Listing not found.");
  if (!isPurchasable(listing)) throw new Error("This listing is no longer available.");

  listing.quantityAvailable -= 1;
  listing.status = listing.quantityAvailable === 0 ? "sold_out" : "active";

  const order: Order = {
    id: `ORD-${Math.floor(Math.random() * 9000 + 1000)}`,
    listingId: listing.id,
    bakeryId: listing.bakeryId,
    customerName: state.session.role === "customer" ? state.session.name : "Walk-in buyer",
    quantity: 1,
    totalPaid: listing.discountedPrice,
    totalSaved: listing.originalPrice - listing.discountedPrice,
    pickupCode: String(Math.floor(Math.random() * 900000 + 100000)),
    status: "paid",
    createdAt: new Date().toISOString(),
  };

  state.orders.unshift(order);
  return order;
}

export function createListingFromForm(state: AppState, form: FormData): Listing {
  const quantity = Number(form.get("quantity"));
  const originalPrice = Number(form.get("originalPrice"));
  const discountedPrice = Number(form.get("discountedPrice"));
  const safetyConfirmed = form.get("safetyConfirmed") === "on";

  if (!safetyConfirmed) throw new Error("Safety confirmation is required before publishing.");
  if (!Number.isFinite(quantity) || quantity < 1) throw new Error("Quantity must be at least 1.");
  if (!Number.isFinite(originalPrice) || !Number.isFinite(discountedPrice)) throw new Error("Prices must be valid numbers.");
  if (discountedPrice >= originalPrice) throw new Error("Discount price must be lower than the original price.");

  const listing: Listing = {
    id: `listing-${Date.now()}`,
    bakeryId: "bakery-sunrise",
    title: String(form.get("title") || "Bakery surplus bundle").trim(),
    category: String(form.get("category") || "bundle") as Listing["category"],
    description: String(form.get("description") || "").trim(),
    image: String(form.get("image") || "").trim(),
    originalPrice,
    discountedPrice,
    quantityTotal: quantity,
    quantityAvailable: quantity,
    pickupStart: String(form.get("pickupStart") || "6:30 PM"),
    pickupEnd: String(form.get("pickupEnd") || "8:00 PM"),
    pickupEndMinutes: 20 * 60,
    bakedLabel: String(form.get("bakedLabel") || "Baked today"),
    ingredients: String(form.get("ingredients") || "Ask bakery staff at pickup."),
    allergens: String(form.get("allergens") || "Ask bakery staff before purchase."),
    status: "active",
    createdAt: new Date().toISOString(),
  };

  if (!listing.title) throw new Error("Listing title is required.");
  if (!listing.description) throw new Error("Description is required.");
  if (!listing.image) throw new Error("Photo URL is required.");
  if (!listing.allergens) throw new Error("Allergen notes are required.");

  state.listings.unshift(listing);
  return listing;
}

export function markPickedUp(state: AppState, orderId: string): void {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) throw new Error("Order not found.");
  if (order.status === "picked_up") throw new Error("Order is already complete.");

  order.status = "picked_up";
  order.pickedUpAt = new Date().toISOString();
}
