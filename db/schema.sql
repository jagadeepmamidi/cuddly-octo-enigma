-- Rbabikerentals.com Phase 1 schema draft
-- Scope: Bengaluru-only operations in Phase 1.

create type role_type as enum ('customer', 'partner_investor', 'admin');
create type kyc_status_type as enum ('not_started', 'in_progress', 'verified', 'manual_review', 'failed', 'expired');
create type booking_status_type as enum ('draft', 'pending_kyc', 'payment_pending', 'confirmed', 'ongoing', 'extension_requested', 'extended', 'completed', 'cancelled');

create table if not exists app_users (
  id text primary key,
  role role_type not null,
  full_name text not null,
  city text not null default 'bengaluru',
  kyc_status kyc_status_type not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vehicles (
  id text primary key,
  owner_id text not null references app_users(id),
  city text not null default 'bengaluru',
  category text not null,
  brand text not null,
  model text not null,
  is_active boolean not null default true,
  deposit_amount integer not null,
  rate_per_hour integer not null,
  rate_per_day integer not null,
  rate_per_week integer not null,
  rate_per_month integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bookings (
  id text primary key,
  user_id text not null references app_users(id),
  vehicle_id text not null references vehicles(id),
  city text not null default 'bengaluru',
  status booking_status_type not null default 'draft',
  pickup_at timestamptz not null,
  drop_at timestamptz not null,
  km_limit_bucket text not null,
  km_limit_value integer not null,
  coupon_code text,
  quote jsonb not null,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists kyc_records (
  user_id text primary key references app_users(id),
  status kyc_status_type not null default 'not_started',
  provider text not null default 'setu_digilocker',
  request_id text,
  aadhaar_verified boolean not null default false,
  dl_verified boolean not null default false,
  needs_manual_review boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists vehicle_block_windows (
  id text primary key,
  vehicle_id text not null references vehicles(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null,
  created_by text not null references app_users(id),
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id text primary key,
  actor_id text not null references app_users(id),
  actor_role role_type not null,
  action text not null,
  resource_type text not null,
  resource_id text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- RLS scaffold (Supabase)
alter table app_users enable row level security;
alter table vehicles enable row level security;
alter table bookings enable row level security;
alter table kyc_records enable row level security;
alter table vehicle_block_windows enable row level security;
alter table audit_events enable row level security;

-- Example policies; refine in implementation hardening:
-- Customers can read only their own bookings.
create policy bookings_customer_select on bookings
for select
to authenticated
using (user_id = auth.uid()::text);

-- Partners can read bookings for vehicles they own.
create policy bookings_partner_select on bookings
for select
to authenticated
using (
  exists (
    select 1 from vehicles v
    where v.id = bookings.vehicle_id and v.owner_id = auth.uid()::text
  )
);

-- All writes from server-side trusted path (service role) in Phase 1.

