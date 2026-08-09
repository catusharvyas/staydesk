-- Phase 6 (Invoices). Two gaps closed:
--
-- 1. `invoices` was the one table without `property_id` — every other table
--    follows the tenant-boundary pattern (PROJECT.md §3) directly; invoices
--    only had it indirectly via booking_id -> bookings.property_id, which
--    meant RLS had to join through bookings and property-scoped queries/
--    numbering couldn't be done directly. Backfilled and made NOT NULL.
--
-- 2. No invoice-numbering mechanism existed. `invoice_counters` is the
--    standard atomic-upsert-counter pattern (safe under concurrent
--    checkouts without needing a real Postgres SEQUENCE per property).
--    `next_invoice_number` is a thin SECURITY DEFINER wrapper around it —
--    NOT a place for GST/pricing math, which stays solely in
--    src/lib/pricing.ts per the single-source-of-truth rule already
--    documented in PROJECT.md §4/§9.

alter table invoices add column if not exists property_id uuid references properties(id) on delete cascade;

update invoices i
set property_id = b.property_id
from bookings b
where b.id = i.booking_id and i.property_id is null;

alter table invoices alter column property_id set not null;
alter table invoices add constraint invoices_property_number_unique unique (property_id, invoice_number);

create index if not exists idx_invoices_property on invoices(property_id);

-- Replace the join-through-bookings RLS policies with the direct
-- property_id pattern used everywhere else.
drop policy if exists invoices_select on invoices;
drop policy if exists invoices_insert on invoices;

create policy invoices_select on invoices for select
  using (internal.is_property_member(property_id));

create policy invoices_insert on invoices for insert
  with check (internal.is_property_member(property_id));

create table if not exists invoice_counters (
  property_id uuid primary key references properties(id) on delete cascade,
  next_number integer not null default 1
);

alter table invoice_counters enable row level security;

create policy invoice_counters_select on invoice_counters for select
  using (internal.is_property_member(property_id));

create or replace function next_invoice_number(p_property_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number integer;
begin
  if not exists (
    select 1 from property_users
    where property_id = p_property_id and user_id = auth.uid()
  ) then
    raise exception 'Not authorized for this property';
  end if;

  insert into invoice_counters (property_id, next_number)
  values (p_property_id, 2)
  on conflict (property_id)
  do update set next_number = invoice_counters.next_number + 1
  returning next_number - 1 into v_number;

  return v_number;
end;
$$;

revoke execute on function next_invoice_number(uuid) from public, anon;
grant execute on function next_invoice_number(uuid) to authenticated;
