import type mapboxgl from "mapbox-gl";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import { animate, press, stagger } from "motion";
import { createInitialState } from "../lib/seed";
import {
  createListingFromForm,
  discountPercent,
  findBakery,
  isPurchasable,
  markPickedUp,
  money,
  reserveListing,
  visibleListings,
} from "../lib/marketplace";
import type { AppState, Listing, Order, SessionRole } from "../lib/types";
import { hasSupabaseConfig } from "../lib/supabaseClient";

const activeViews = new Set<AppState["activeView"]>(["market", "orders", "bakery"]);
const mapboxToken = (import.meta.env.PUBLIC_MAPBOX_TOKEN ?? "").trim();
const buyerLocation: [number, number] = [101.7175, 3.2035];
const state: AppState = loadState();
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
type MapboxGL = typeof mapboxgl;
let mapboxApi: MapboxGL | null = null;
let mapboxLoad: Promise<MapboxGL> | null = null;
let mapboxMap: MapboxMap | null = null;
let mapboxMarkers: Marker[] = [];
let selectedMapListingId: string | undefined;

function loadMapbox(): Promise<MapboxGL> {
  if (mapboxApi) return Promise.resolve(mapboxApi);
  if (!mapboxLoad) {
    mapboxLoad = import("mapbox-gl").then((module) => {
      mapboxApi = module.default;
      return mapboxApi;
    });
  }
  return mapboxLoad;
}

function loadState(): AppState {
  const stored = window.localStorage.getItem("breadsaver-state");
  if (!stored) return createInitialState();

  try {
    const parsed = { ...createInitialState(), ...JSON.parse(stored) } as AppState;
    if (!activeViews.has(parsed.activeView)) parsed.activeView = "market";
    return parsed;
  } catch {
    return createInitialState();
  }
}

function persist(): void {
  window.localStorage.setItem("breadsaver-state", JSON.stringify(state));
}

function qs<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

function optional<T extends Element>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

function qsa<T extends Element>(selector: string): T[] {
  return [...document.querySelectorAll<T>(selector)];
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char] ?? char;
  });
}

function icon(name: "clock" | "mapPin" | "package" | "percent" | "x"): string {
  const paths: Record<typeof name, string> = {
    clock: `<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`,
    mapPin: `<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>`,
    package: `<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><path d="m3.3 7 8.7 5 8.7-5"></path>`,
    percent: `<line x1="19" x2="5" y1="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle>`,
    x: `<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`,
  };

  return `<svg class="lucide-inline" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

function animateIntoView(selector: string, y = 12): void {
  if (prefersReducedMotion) return;
  window.requestAnimationFrame(() => {
    animate(selector, { opacity: [0, 1], y: [y, 0] }, { duration: 0.36, delay: stagger(0.045), easing: [0.16, 1, 0.3, 1] });
  });
}

function animateActiveView(): void {
  if (prefersReducedMotion) return;
  animate(".view.active", { opacity: [0, 1], y: [8, 0] }, { duration: 0.28, easing: [0.16, 1, 0.3, 1] });
}

function bindPressMotion(): void {
  if (prefersReducedMotion) return;
  press("button:not(:disabled), .listing-card:not(.is-sold-out)", (element) => {
    animate(element, { scale: 0.985 }, { duration: 0.1 });
    return () => animate(element, { scale: 1 }, { duration: 0.18, easing: [0.16, 1, 0.3, 1] });
  });
}

function pickupUrgency(listing: Listing): string {
  if (!isPurchasable(listing)) return "Sold out";
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const minutesLeft = listing.pickupEndMinutes - nowMinutes;

  if (minutesLeft <= 0) return "Last call";
  if (minutesLeft < 60) return `Ends in ${minutesLeft}m`;
  if (minutesLeft < 180) {
    const hours = Math.floor(minutesLeft / 60);
    const minutes = minutesLeft % 60;
    return minutes ? `Ends in ${hours}h ${minutes}m` : `Ends in ${hours}h`;
  }
  return `Pickup ${listing.pickupStart}`;
}

function showToast(message: string): void {
  const region = qs<HTMLDivElement>("#toast-region");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  region.append(toast);
  if (!prefersReducedMotion) {
    animate(toast, { opacity: [0, 1], y: [12, 0] }, { duration: 0.22, easing: [0.16, 1, 0.3, 1] });
  }
  window.setTimeout(() => toast.remove(), 3200);
}

function setView(view: AppState["activeView"]): void {
  if (!activeViews.has(view)) view = "market";
  state.activeView = view;
  qsa<HTMLElement>(".view").forEach((element) => element.classList.toggle("active", element.id === `${view}-view`));
  qsa<HTMLButtonElement>("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  render();
  animateActiveView();
}

function setSession(role: SessionRole): void {
  const names: Record<SessionRole, string> = {
    guest: "Guest",
    customer: "Mia Chen",
    bakery: "Sunrise staff",
  };
  state.session = { role, name: names[role] };
  persist();
  render();
  showToast(role === "guest" ? "Signed out." : `Signed in as ${names[role]}.`);
}

function renderSession(): void {
  const sessionName = optional("#session-name");
  const sessionRole = optional("#session-role");
  const logoutButton = optional<HTMLButtonElement>("#logout-btn");

  if (sessionName) sessionName.textContent = state.session.name;
  if (sessionRole) sessionRole.textContent = state.session.role === "guest" ? "not signed in" : state.session.role;
  if (logoutButton) logoutButton.disabled = state.session.role === "guest";
  qs("#backend-mode").textContent = hasSupabaseConfig ? "Supabase env detected - demo writes stay local" : "Local demo mode";
}

function renderMetrics(): void {
  const rescued = 34 + state.orders.filter((order) => order.status !== "refunded").length;
  const saved = 126 + state.orders.reduce((sum, order) => sum + order.totalSaved, 0);
  const nextPickup = state.listings.find(isPurchasable)?.pickupStart ?? "Sold out";

  qs("#metric-rescued").textContent = String(rescued);
  qs("#metric-saved").textContent = money(saved);
  qs("#metric-window").textContent = nextPickup;
}

function listingCard(listing: Listing): string {
  const bakery = findBakery(state, listing.bakeryId);
  const soldOut = !isPurchasable(listing);
  const pickupWindow = `${escapeHtml(listing.pickupStart)}-${escapeHtml(listing.pickupEnd)}`;
  const discount = discountPercent(listing);

  return `
    <article class="listing-card ${soldOut ? "is-sold-out" : ""}" data-listing-id="${listing.id}">
      <div class="listing-card-image">
        <img src="${escapeHtml(listing.image)}" alt="${escapeHtml(listing.title)}" />
        <div class="discount-pill">${icon("percent")} ${discount}% off</div>
        ${
          soldOut
            ? `<div class="sold-out-overlay"><span>Sold out</span></div>`
            : `
              <div class="time-pill">${icon("clock")} ${escapeHtml(pickupUrgency(listing))}</div>
              <div class="qty-pill">${icon("package")} ${listing.quantityAvailable}</div>
            `
        }
      </div>
      <div class="card-body">
        <div class="card-main-row">
          <div class="card-title-stack">
            <h3>${escapeHtml(listing.title)}</h3>
            <p class="muted meta-line">${icon("mapPin")} ${escapeHtml(bakery.name)} <span>${bakery.distanceKm.toFixed(1)} km</span></p>
          </div>
          <div class="price-stack">
            <span class="old-price">${money(listing.originalPrice)}</span>
            <span class="price">${money(listing.discountedPrice)}</span>
          </div>
        </div>
        <div class="card-footer">
          <p class="pickup-line">${icon("clock")} ${pickupWindow}</p>
          <button class="primary-btn" data-open-listing="${listing.id}" ${soldOut ? "disabled" : ""}>${soldOut ? "Unavailable" : `${icon("package")} Reserve`}</button>
        </div>
      </div>
    </article>
  `;
}

function renderMarket(): void {
  const listings = visibleListings(state);
  qs("#result-count").textContent = `${listings.length} listing${listings.length === 1 ? "" : "s"}`;
  qs("#area-label").textContent = `${state.area} ${state.radiusKm} km`;

  qs("#listing-grid").innerHTML = listings.length
    ? listings.map(listingCard).join("")
    : `<div class="empty-state"><h2>No matching bread nearby.</h2><p>Try a wider radius or another category. You can still choose an area manually.</p><button class="secondary-btn" data-open-location>Change area</button></div>`;

  renderMap(listings);
  renderActiveOrder();
  animateIntoView("#listing-grid .listing-card", 14);
}

function renderMap(listings: Listing[]): void {
  const map = qs("#map-listings");
  disposeMapboxMap();

  const selected = listings.find((listing) => listing.id === selectedMapListingId) ?? listings[0];
  selectedMapListingId = selected?.id;

  map.innerHTML = `
    <div class="mapbox-shell">
      ${
        mapboxToken
          ? `<div class="mapbox-map" id="mapbox-map" role="application" aria-label="Mapbox bakery pickup map"></div>`
          : mapFallback(listings)
      }
      <div class="map-status" id="map-status">${mapboxToken ? "Loading map" : "Pickup map preview"}</div>
    </div>
    <div id="map-preview">${selected ? listingCard(selected) : ""}</div>
  `;
}

function mapFallback(listings: Listing[]): string {
  const pins = listings.map((listing) => {
    const bakery = findBakery(state, listing.bakeryId);
    const x = 18 + ((bakery.longitude - 101.707) / (101.722 - 101.707)) * 64;
    const y = 72 - ((bakery.latitude - 3.198) / (3.211 - 3.198)) * 54;
    return `<button class="fallback-pin" style="left:${Math.min(86, Math.max(12, x))}%; top:${Math.min(82, Math.max(14, y))}%;" data-map-pin="${listing.id}" aria-label="${escapeHtml(listing.title)}">${listing.quantityAvailable}</button>`;
  });

  return `
    <div class="map-token-empty">
      <div class="fallback-grid" aria-label="Static bakery pickup preview">
        ${pins.join("")}
        <span class="fallback-home">You</span>
      </div>
      <p>Live Mapbox is unavailable. Pickup pins still work.</p>
    </div>
  `;
}

function disposeMapboxMap(): void {
  mapboxMarkers.forEach((marker) => marker.remove());
  mapboxMarkers = [];
  mapboxMap?.remove();
  mapboxMap = null;
}

function mapCoordinates(listing: Listing): [number, number] {
  const bakery = findBakery(state, listing.bakeryId);
  return [bakery.longitude, bakery.latitude];
}

function mapCenter(listings: Listing[]): [number, number] {
  if (!listings.length) return buyerLocation;
  const totals = listings.reduce(
    (sum, listing) => {
      const [longitude, latitude] = mapCoordinates(listing);
      return { longitude: sum.longitude + longitude, latitude: sum.latitude + latitude };
    },
    { longitude: buyerLocation[0], latitude: buyerLocation[1] },
  );
  const count = listings.length + 1;
  return [totals.longitude / count, totals.latitude / count];
}

function markerElement(listing: Listing): HTMLButtonElement {
  const bakery = findBakery(state, listing.bakeryId);
  const marker = document.createElement("button");
  marker.type = "button";
  marker.className = `mapbox-marker${isPurchasable(listing) ? "" : " is-sold-out"}${listing.id === selectedMapListingId ? " is-active" : ""}`;
  marker.dataset.mapPin = listing.id;
  marker.setAttribute("aria-label", `${listing.title}, ${bakery.name}`);
  marker.innerHTML = `<span>${discountPercent(listing)}%</span><small>${money(listing.discountedPrice)}</small>`;
  marker.addEventListener("click", (event) => {
    event.stopPropagation();
    selectMapListing(listing.id);
  });
  return marker;
}

function homeMarkerElement(): HTMLDivElement {
  const marker = document.createElement("div");
  marker.className = "mapbox-home-marker";
  marker.textContent = "You";
  return marker;
}

function selectMapListing(listingId: string): void {
  const listing = state.listings.find((item) => item.id === listingId);
  if (!listing) return;
  selectedMapListingId = listing.id;
  const preview = optional("#map-preview");
  if (preview) preview.innerHTML = listingCard(listing);
  qsa<HTMLElement>(".mapbox-marker").forEach((marker) => {
    marker.classList.toggle("is-active", marker.dataset.mapPin === listing.id);
  });
}

async function syncMapboxMap(listings: Listing[]): Promise<void> {
  if (!mapboxToken || state.browseMode !== "map") return;

  const container = optional<HTMLElement>("#mapbox-map");
  if (!container) return;
  if (mapboxMap) {
    mapboxMap.resize();
    renderMapboxMarkers(listings);
    fitMapToListings(listings);
    return;
  }

  try {
    const mapboxgl = await loadMapbox();
    if (state.browseMode !== "map" || !optional<HTMLElement>("#mapbox-map")) return;

    if (!mapboxgl.supported()) {
      optional("#map-status")?.replaceChildren(document.createTextNode("Mapbox needs WebGL"));
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    mapboxMap = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/streets-v12",
      center: mapCenter(listings),
      zoom: listings.length ? 13 : 12,
      attributionControl: false,
    });

    mapboxMap.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    mapboxMap.on("load", () => {
      renderMapboxMarkers(listings);
      fitMapToListings(listings);
      optional("#map-status")?.replaceChildren(document.createTextNode(`${listings.length} pickup spots`));
      mapboxMap?.resize();
    });
    mapboxMap.on("error", () => {
      optional("#map-status")?.replaceChildren(document.createTextNode("Mapbox could not load"));
    });
  } catch {
    optional("#map-status")?.replaceChildren(document.createTextNode("Map unavailable"));
  }
}

function renderMapboxMarkers(listings: Listing[]): void {
  if (!mapboxMap || !mapboxApi) return;
  const mapboxgl = mapboxApi;
  mapboxMarkers.forEach((marker) => marker.remove());
  mapboxMarkers = [
    new mapboxgl.Marker({ element: homeMarkerElement(), anchor: "center" }).setLngLat(buyerLocation).addTo(mapboxMap),
  ];

  listings.forEach((listing) => {
    const bakery = findBakery(state, listing.bakeryId);
    const popup = new mapboxgl.Popup({ offset: 22 }).setHTML(`
      <strong>${escapeHtml(listing.title)}</strong><br />
      ${escapeHtml(bakery.name)} - ${discountPercent(listing)}% off - ${listing.quantityAvailable} left
    `);
    const marker = new mapboxgl.Marker({ element: markerElement(listing), anchor: "bottom" })
      .setLngLat(mapCoordinates(listing))
      .setPopup(popup)
      .addTo(mapboxMap as MapboxMap);
    mapboxMarkers.push(marker);
  });
}

function fitMapToListings(listings: Listing[]): void {
  if (!mapboxMap || !mapboxApi) return;
  const bounds = new mapboxApi.LngLatBounds(buyerLocation, buyerLocation);
  listings.forEach((listing) => bounds.extend(mapCoordinates(listing)));

  mapboxMap.fitBounds(bounds, {
    padding: { top: 58, bottom: 86, left: 38, right: 38 },
    maxZoom: 14.5,
    duration: 0,
  });
}

function receipt(order: Order): string {
  const listing = state.listings.find((item) => item.id === order.listingId);
  if (!listing) return "";
  const bakery = findBakery(state, order.bakeryId);
  const complete = order.status === "picked_up";

  return `
    <article class="order-card">
      <div class="badge-row">
        <span class="badge ${complete ? "" : "warn"}">${complete ? "Picked up" : "Paid"}</span>
        <span class="badge">${escapeHtml(order.id)}</span>
      </div>
      <h3>${escapeHtml(bakery.name)}</h3>
      <span class="receipt-code">${escapeHtml(order.pickupCode)}</span>
      <p><strong>${escapeHtml(listing.title)}</strong><br />Collect ${escapeHtml(listing.pickupStart)}-${escapeHtml(listing.pickupEnd)}</p>
      <div class="detail-list">
        <div class="detail-row"><span>Address</span><strong>${escapeHtml(bakery.address)}</strong></div>
        <div class="detail-row"><span>Phone</span><strong>${escapeHtml(bakery.phone)}</strong></div>
        <div class="detail-row"><span>Paid</span><strong>${money(order.totalPaid)} - saved ${money(order.totalSaved)}</strong></div>
      </div>
    </article>
  `;
}

function renderActiveOrder(): void {
  const active = state.orders.find((order) => order.status !== "picked_up" && order.status !== "refunded");
  qs("#active-order").innerHTML = active ? receipt(active) : "";
}

function renderOrders(): void {
  qs("#orders-list").innerHTML = state.orders.length
    ? state.orders.map(receipt).join("")
    : `<div class="empty-state"><h2>No pickups yet.</h2><p>Your paid receipt, code, store phone, map cue, and savings appear after checkout.</p></div>`;
}

function renderBakery(): void {
  const waiting = state.orders.filter((order) => order.status !== "picked_up");
  const revenue = state.orders.reduce((sum, order) => sum + order.totalPaid, 0);
  const left = state.listings.reduce((sum, listing) => sum + listing.quantityAvailable, 0);

  qs("#bakery-auth").classList.toggle("hidden", state.session.role === "bakery");
  qs("#bakery-workspace").classList.toggle("hidden", state.session.role !== "bakery");
  qs("#bakery-revenue").textContent = money(revenue);
  qs("#bakery-orders").textContent = String(state.orders.length);
  qs("#bakery-left").textContent = String(left);

  qs("#active-listings").innerHTML = state.listings.slice(0, 5).map((listing) => `
    <div class="queue-card">
      <div class="queue-row">
        <strong>${escapeHtml(listing.title)}</strong>
        <span class="badge ${listing.status === "sold_out" ? "danger" : ""}">${listing.status === "sold_out" ? "Sold out" : `${listing.quantityAvailable} left`}</span>
      </div>
      <p class="muted">${money(listing.discountedPrice)} - Collect ${escapeHtml(listing.pickupStart)}-${escapeHtml(listing.pickupEnd)}</p>
    </div>
  `).join("");

  qs("#pickup-queue").innerHTML = waiting.length
    ? waiting.map((order) => {
        const listing = state.listings.find((item) => item.id === order.listingId);
        return `
          <div class="queue-card">
            <div class="badge-row"><span class="badge">Paid</span><span class="badge">${escapeHtml(order.pickupCode)}</span></div>
            <h3>${escapeHtml(listing?.title ?? "Order")}</h3>
            <p class="muted">${escapeHtml(order.customerName)} - ${money(order.totalPaid)} - saved ${money(order.totalSaved)}</p>
            <button class="primary-btn" data-pickup="${order.id}">Mark picked up</button>
          </div>
        `;
      }).join("")
    : `<div class="empty-state"><h2>No paid pickups waiting.</h2><p>New prepaid orders appear here with code, item, and pickup window.</p></div>`;
}

function openListing(listingId: string): void {
  const listing = state.listings.find((item) => item.id === listingId);
  if (!listing) return;
  state.selectedListingId = listing.id;
  const bakery = findBakery(state, listing.bakeryId);
  const dialog = qs<HTMLDialogElement>("#listing-dialog");
  const discount = discountPercent(listing);

  qs("#listing-dialog-content").innerHTML = `
    <div class="modal-inner">
      <div class="modal-image">
        <img src="${escapeHtml(listing.image)}" alt="${escapeHtml(listing.title)}" />
        <span class="discount-pill">${icon("percent")} ${discount}% off</span>
      </div>
      <div class="modal-body">
        <div class="section-title">
          <div>
            <p class="eyebrow">${escapeHtml(bakery.name)} - ${bakery.distanceKm.toFixed(1)} km</p>
            <h2>${escapeHtml(listing.title)}</h2>
          </div>
          <button class="icon-btn close-btn" data-close-dialog aria-label="Close">${icon("x")}</button>
        </div>
        <div class="badge-row">
          <span class="badge">${listing.quantityAvailable} left</span>
          <span class="badge warn">${discount}% off</span>
          <span class="badge">${escapeHtml(listing.bakedLabel)}</span>
          <span class="badge">Verified bakery</span>
        </div>
        <div class="detail-list">
          <div class="detail-row"><span>${icon("clock")} Pickup</span><strong>${escapeHtml(listing.pickupStart)}-${escapeHtml(listing.pickupEnd)}</strong></div>
          <div class="detail-row"><span>${icon("percent")} Price</span><strong>${money(listing.discountedPrice)} <span class="old-price">${money(listing.originalPrice)}</span></strong></div>
          <div class="detail-row"><span>${icon("mapPin")} Address</span><strong>${escapeHtml(bakery.address)}</strong></div>
          <div class="detail-row"><span>Trust</span><strong>${bakery.rating.toFixed(1)} from ${bakery.ratingCount} - ${bakery.pickupSuccessRate}% pickup success</strong></div>
        </div>
        <div>
          <h3>What you could get</h3>
          <p>${escapeHtml(listing.description)}</p>
        </div>
        <div>
          <h3>Ingredients and allergens</h3>
          <p>${escapeHtml(listing.ingredients)} ${escapeHtml(listing.allergens)}</p>
        </div>
        <button class="primary-btn" data-reserve="${listing.id}" ${isPurchasable(listing) ? "" : "disabled"}>${icon("package")} Pay and reserve</button>
      </div>
    </div>
  `;

  dialog.showModal();
  if (!prefersReducedMotion) {
    animate(dialog, { opacity: [0, 1] }, { duration: 0.18 });
    animate("#listing-dialog .modal-inner", { y: [18, 0], scale: [0.98, 1] }, { duration: 0.28, easing: [0.16, 1, 0.3, 1] });
  }
}

function openLocationDialog(): void {
  const dialog = qs<HTMLDialogElement>("#location-dialog");
  dialog.showModal();
  if (!prefersReducedMotion) {
    animate(dialog, { opacity: [0, 1] }, { duration: 0.18 });
    animate("#location-dialog .modal-body", { y: [16, 0], scale: [0.98, 1] }, { duration: 0.24, easing: [0.16, 1, 0.3, 1] });
  }
}

function repeatYesterday(): void {
  const form = qs<HTMLFormElement>("#listing-form");
  const values: Record<string, string> = {
    title: "Sourdough end-of-day bundle",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    quantity: "4",
    originalPrice: "14",
    discountedPrice: "6",
    pickupStart: "6:30 PM",
    pickupEnd: "8:00 PM",
    description: "Mixed sourdough slices, milk buns, and croissants packed after the evening count.",
    ingredients: "Sourdough, milk buns, croissants.",
    allergens: "Contains wheat, milk, egg. May contain nuts.",
  };

  Object.entries(values).forEach(([name, value]) => {
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) field.value = value;
  });
  showToast("Yesterday's listing loaded.");
}

function bindEvents(): void {
  qsa<HTMLButtonElement>("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view as AppState["activeView"]));
  });

  qs<HTMLInputElement>("#search-input").addEventListener("input", (event) => {
    state.searchQuery = (event.target as HTMLInputElement).value;
    persist();
    render();
  });

  qsa<HTMLButtonElement>("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFilter = button.dataset.filter as AppState["activeFilter"];
      persist();
      render();
    });
  });

  qsa<HTMLButtonElement>("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.browseMode = button.dataset.mode as AppState["browseMode"];
      persist();
      render();
    });
  });

  optional("#login-customer")?.addEventListener("click", () => setSession("customer"));
  optional("#login-bakery")?.addEventListener("click", () => setSession("bakery"));
  optional("#bakery-login-inline")?.addEventListener("click", () => setSession("bakery"));
  optional("#logout-btn")?.addEventListener("click", () => setSession("guest"));
  qs("#repeat-btn").addEventListener("click", repeatYesterday);
  qs("#open-location").addEventListener("click", openLocationDialog);

  qs<HTMLFormElement>("#listing-form").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      createListingFromForm(state, new FormData(event.currentTarget as HTMLFormElement));
      persist();
      showToast("Listing published.");
      setView("market");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Listing could not be published.");
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest("button");
    if (!button) return;

    const openId = button.dataset.openListing;
    const reserveId = button.dataset.reserve;
    const saveId = button.dataset.save;
    const reportId = button.dataset.report;
    const pickupId = button.dataset.pickup;
    const mapPin = button.dataset.mapPin;
    const area = button.dataset.area;

    if (openId) openListing(openId);
    if (reserveId) {
      if (state.session.role === "guest") {
        setSession("customer");
      }
      try {
        const order = reserveListing(state, reserveId);
        persist();
        qs<HTMLDialogElement>("#listing-dialog").close();
        setView("orders");
        showToast(`Reserved. Pickup code ${order.pickupCode}.`);
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Could not reserve this listing.");
      }
    }
    if (saveId) {
      state.savedListingIds = state.savedListingIds.includes(saveId)
        ? state.savedListingIds.filter((id) => id !== saveId)
        : [...state.savedListingIds, saveId];
      persist();
      render();
    }
    if (reportId) {
      if (!state.reportedListingIds.includes(reportId)) state.reportedListingIds.push(reportId);
      persist();
      render();
      showToast("Listing flagged for admin review.");
    }
    if (pickupId) {
      try {
        markPickedUp(state, pickupId);
        persist();
        render();
        showToast("Pickup completed.");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Could not complete pickup.");
      }
    }
    if (mapPin) selectMapListing(mapPin);
    if (button.hasAttribute("data-open-location")) openLocationDialog();
    if (button.hasAttribute("data-close-dialog")) {
      button.closest("dialog")?.close();
    }
    if (area) {
      state.area = area;
      state.radiusKm = Number(button.dataset.radius ?? 3);
      persist();
      qs<HTMLDialogElement>("#location-dialog").close();
      render();
    }
  });
}

function render(): void {
  renderSession();
  renderMetrics();
  renderMarket();
  renderOrders();
  renderBakery();

  qsa<HTMLButtonElement>("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.activeFilter);
  });
  qsa<HTMLButtonElement>("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.browseMode);
  });
  qs("#list-panel").classList.toggle("hidden", state.browseMode !== "list");
  qs("#map-panel").classList.toggle("hidden", state.browseMode !== "map");
  if (state.browseMode === "map") {
    window.requestAnimationFrame(() => void syncMapboxMap(visibleListings(state)));
  }
}

export function mountBreadSaverApp(): void {
  bindEvents();
  bindPressMotion();
  setView(state.activeView);
  animateIntoView(".market-head, .controls, .chip-row, .impact-strip", 8);
}
