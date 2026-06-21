-- BreadSaver production schema sketch.
-- Use with a real Supabase project after reviewing local legal/food-safety requirements.

create extension if not exists pgcrypto;

create type public.bakery_status as enum ('pending_review', 'approved', 'suspended');
create type public.listing_status as enum ('draft', 'active', 'paused', 'sold_out', 'expired', 'removed');
create type public.order_status as enum ('pending_payment', 'paid', 'ready_for_pickup', 'picked_up', 'missed_pickup', 'refunded', 'cancelled');
create type public.listing_category as enum ('bread', 'pastry', 'bundle', 'other');

create table public.bakeries (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status public.bakery_status not null default 'pending_review',
  address text not null,
  phone text not null,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  rating_average numeric(3, 2) default 0,
  rating_count integer not null default 0,
  pickup_success_rate integer not null default 0,
  safety_acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  title text not null,
  category public.listing_category not null,
  description text not null,
  photo_url text not null,
  original_price_cents integer not null check (original_price_cents > 0),
  discounted_price_cents integer not null check (discounted_price_cents > 0),
  quantity_total integer not null check (quantity_total > 0),
  quantity_available integer not null check (quantity_available >= 0),
  pickup_start_at timestamptz not null,
  pickup_end_at timestamptz not null,
  baked_label text not null,
  ingredients_notes text not null,
  allergen_notes text not null,
  safety_confirmed_at timestamptz not null,
  status public.listing_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discounted_below_original check (discounted_price_cents < original_price_cents),
  constraint pickup_end_after_start check (pickup_end_at > pickup_start_at)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  bakery_id uuid not null references public.bakeries(id),
  customer_user_id uuid not null references auth.users(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  total_paid_cents integer not null check (total_paid_cents >= 0),
  total_saved_cents integer not null check (total_saved_cents >= 0),
  pickup_code text not null,
  status public.order_status not null default 'paid',
  paid_at timestamptz,
  picked_up_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references auth.users(id) on delete set null,
  target_type text not null check (target_type in ('listing', 'bakery', 'order')),
  target_id uuid not null,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table public.bakeries enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.reports enable row level security;

create policy "approved bakeries are public" on public.bakeries
  for select
  to anon, authenticated
  using (status = 'approved');

create policy "bakery owners can read own bakery" on public.bakeries
  for select
  to authenticated
  using ((select auth.uid()) = owner_user_id);

create policy "bakery owners can update own bakery" on public.bakeries
  for update
  to authenticated
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);

create policy "active listings are public" on public.listings
  for select
  to anon, authenticated
  using (status in ('active', 'sold_out') and pickup_end_at > now());

create policy "bakery owners can manage own listings" on public.listings
  for all
  to authenticated
  using (
    exists (
      select 1 from public.bakeries
      where bakeries.id = listings.bakery_id
        and bakeries.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.bakeries
      where bakeries.id = listings.bakery_id
        and bakeries.owner_user_id = (select auth.uid())
    )
  );

create policy "customers can read own orders" on public.orders
  for select
  to authenticated
  using ((select auth.uid()) = customer_user_id);

create policy "bakery owners can read pickup queue" on public.orders
  for select
  to authenticated
  using (
    exists (
      select 1 from public.bakeries
      where bakeries.id = orders.bakery_id
        and bakeries.owner_user_id = (select auth.uid())
    )
  );

create policy "bakery owners can update pickup status" on public.orders
  for update
  to authenticated
  using (
    exists (
      select 1 from public.bakeries
      where bakeries.id = orders.bakery_id
        and bakeries.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.bakeries
      where bakeries.id = orders.bakery_id
        and bakeries.owner_user_id = (select auth.uid())
    )
  );

create policy "authenticated users can create reports" on public.reports
  for insert
  to authenticated
  with check ((select auth.uid()) = reporter_user_id);

-- Production reservation note:
-- Do not let the browser perform listing decrement and order insert as two separate calls.
-- Create the paid order only after payment success from a trusted server or Edge Function,
-- and update listings with a single SQL transaction:
--
-- update public.listings
-- set quantity_available = quantity_available - 1,
--     status = case when quantity_available - 1 = 0 then 'sold_out' else status end,
--     updated_at = now()
-- where id = :listing_id
--   and status = 'active'
--   and quantity_available >= :quantity
--   and pickup_end_at > now();
--
-- Then insert the order only if the update affected exactly one row.
