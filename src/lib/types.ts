export type Currency = "MYR";

export type ListingCategory = "bread" | "pastry" | "bundle";

export type ListingStatus = "active" | "sold_out" | "expired" | "paused";

export type OrderStatus = "paid" | "ready_for_pickup" | "picked_up" | "missed_pickup" | "refunded";

export type SessionRole = "guest" | "customer" | "bakery";

export interface Bakery {
  id: string;
  name: string;
  address: string;
  phone: string;
  area: string;
  distanceKm: number;
  rating: number;
  ratingCount: number;
  pickupSuccessRate: number;
  verified: boolean;
  latitude: number;
  longitude: number;
}

export interface Listing {
  id: string;
  bakeryId: string;
  title: string;
  category: ListingCategory;
  description: string;
  image: string;
  originalPrice: number;
  discountedPrice: number;
  quantityTotal: number;
  quantityAvailable: number;
  pickupStart: string;
  pickupEnd: string;
  pickupEndMinutes: number;
  bakedLabel: string;
  ingredients: string;
  allergens: string;
  status: ListingStatus;
  createdAt: string;
}

export interface Order {
  id: string;
  listingId: string;
  bakeryId: string;
  customerName: string;
  quantity: number;
  totalPaid: number;
  totalSaved: number;
  pickupCode: string;
  status: OrderStatus;
  createdAt: string;
  pickedUpAt?: string;
}

export interface Session {
  role: SessionRole;
  name: string;
}

export interface AppState {
  bakeries: Bakery[];
  listings: Listing[];
  orders: Order[];
  savedListingIds: string[];
  reportedListingIds: string[];
  session: Session;
  activeFilter: "all" | ListingCategory | "soon" | "cheap";
  activeView: "market" | "orders" | "bakery";
  browseMode: "list" | "map";
  area: string;
  radiusKm: number;
  searchQuery: string;
  selectedListingId?: string;
}
