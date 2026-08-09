-- Stay: initial multi-tenant schema
-- See PROJECT.md §4 for the design rationale.

create extension if not exists "uuid-ossp";
create extension if not exists btree_gist;

-- ========== Enums ==========
create type property_role as enum ('owner', 'admin', 'front_desk', 'housekeeping');
create type room_status as enum ('available', 'occupied', 'reserved', 'cleaning', 'maintenance');
create type booking_status as enum ('reserved', 'checked_in', 'checked_out', 'cancelled');
create type payment_mode as enum ('cash', 'upi', 'card', 'bank_transfer');
create type rounding_mode as enum ('none', 'nearest', 'up', 'down');

-- ========== Core tenancy ==========
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

create table properties (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  address text,
  state_code text,        -- drives CGST+SGST vs IGST at invoice time
  gstin text,
  timezone text not null default 'Asia/Kolkata',
  currency text not null default 'INR',
  created_at timestamptz not null default now()
);

create table property_users (
  property_id uuid not null references properties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role property_role not null,
  created_at timestamptz not null default now(),
  primary key (property_id, user_id)
);

-- ========== Rooms ==========
create table room_types (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  base_rate numeric(10,2) not null,
  extra_bed_rate numeric(10,2) not null default 0,
  max_occupancy int not null default 2,
  created_at timestamptz not null default now()
);

create table rooms (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  room_type_id uuid not null references room_types(id) on delete restrict,
  number text not null,
  floor text,
  status room_status not null default 'available',
  notes text,
  created_at timestamptz not null default now(),
  unique (property_id, number)
);

create table room_status_log (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references rooms(id) on delete cascade,
  from_status room_status,
  to_status room_status not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

-- ========== Guests ==========
create table guests (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  id_proof_type text,
  id_proof_number text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

-- ========== Bookings ==========
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  guest_id uuid not null references guests(id) on delete restrict,
  room_id uuid not null references rooms(id) on delete restrict,
  check_in_planned date not null,
  check_out_planned date not null,
  check_in_actual timestamptz,
  check_out_actual timestamptz,
  status booking_status not null default 'reserved',
  rate_override numeric(10,2),
  discount numeric(10,2) not null default 0,
  stay_range daterange generated always as (
    daterange(check_in_planned, check_out_planned, '[)')
  ) stored,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint valid_dates check (check_out_planned > check_in_planned)
);

-- Prevent overlapping active bookings for the same room at the DB level —
-- this is the real guard against double-booking, not just a UI check.
-- Only 'reserved' and 'checked_in' bookings block a room.
alter table bookings
  add constraint no_overlapping_bookings
  exclude using gist (
    room_id with =,
    stay_range with &&
  ) where (status in ('reserved', 'checked_in'));

create table booking_charges (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  description text not null,
  amount numeric(10,2) not null,
  taxable boolean not null default true,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  mode payment_mode not null,
  reference text,
  received_at timestamptz not null default now(),
  received_by uuid references auth.users(id)
);

-- ========== Tax & invoicing ==========
-- One row per property — GST logic is configurable, never hardcoded.
create table tax_settings (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null unique references properties(id) on delete cascade,
  gst_enabled boolean not null default true,
  rate_band_1_threshold numeric(10,2) not null default 7500,
  rate_band_1_rate numeric(5,2) not null default 12,
  rate_band_2_rate numeric(5,2) not null default 18,
  intra_state_split boolean not null default true,
  rounding_mode rounding_mode not null default 'nearest',
  updated_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete restrict,
  invoice_number text not null,
  issued_at timestamptz not null default now(),
  taxable_value numeric(10,2) not null,
  cgst numeric(10,2) not null default 0,
  sgst numeric(10,2) not null default 0,
  igst numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  pdf_url text,
  unique (booking_id)
);

-- ========== Indexes ==========
create index idx_properties_org on properties(org_id);
create index idx_property_users_user on property_users(user_id);
create index idx_room_types_property on room_types(property_id);
create index idx_rooms_property on rooms(property_id);
create index idx_rooms_status on rooms(property_id, status);
create index idx_guests_property on guests(property_id);
create index idx_bookings_property on bookings(property_id);
create index idx_bookings_room on bookings(room_id);
create index idx_bookings_guest on bookings(guest_id);
create index idx_booking_charges_booking on booking_charges(booking_id);
create index idx_payments_booking on payments(booking_id);
