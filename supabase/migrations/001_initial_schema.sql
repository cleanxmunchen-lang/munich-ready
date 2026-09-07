create extension if not exists "pgcrypto";

create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ref_code text not null unique check (ref_code ~ '^[a-z0-9_-]{1,64}$'),
  address text,
  commission_percent numeric(5,2) not null default 0 check (commission_percent >= 0 and commission_percent <= 100),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','expired','failed','refunded')),
  customer_name text not null,
  room_number text,
  phone text not null,
  hotel_id uuid references public.hotels(id) on delete set null,
  hotel_ref text,
  delivery_address text not null,
  delivery_type text not null,
  delivery_fee integer not null check (delivery_fee >= 0),
  subtotal integer not null check (subtotal >= 0),
  total integer not null check (total >= 0),
  currency text not null default 'eur',
  items jsonb not null,
  hotel_commission integer not null default 0,
  status text not null default 'pending_payment' check (status in ('pending_payment','paid','preparing','out_for_delivery','delivered','cancelled')),
  special_instructions text,
  created_at timestamptz not null default now()
);
create index orders_hotel_id_idx on public.orders(hotel_id);
create index orders_created_at_idx on public.orders(created_at desc);
alter table public.hotels enable row level security;
alter table public.orders enable row level security;
-- No browser policies are created: all reads and writes use server-side service role.
insert into public.hotels (name, ref_code, commission_percent, active) values ('Partner Hotel Munich', 'hotel01', 15, true) on conflict (ref_code) do nothing;
