-- Row-level security: every operational table is scoped to properties the
-- requesting user belongs to via property_users. Tenant isolation is
-- enforced here, in the database, not in application code.

create or replace function is_property_member(p_property_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from property_users pu
    where pu.property_id = p_property_id
      and pu.user_id = auth.uid()
  );
$$;

create or replace function current_property_role(p_property_id uuid)
returns property_role
language sql
security definer
stable
as $$
  select role from property_users pu
  where pu.property_id = p_property_id
    and pu.user_id = auth.uid()
  limit 1;
$$;

-- ========== organizations ==========
alter table organizations enable row level security;

create policy org_select on organizations for select
  using (exists (
    select 1 from properties p
    where p.org_id = organizations.id and is_property_member(p.id)
  ));

-- ========== properties ==========
alter table properties enable row level security;

create policy properties_select on properties for select
  using (is_property_member(id));

create policy properties_update on properties for update
  using (current_property_role(id) in ('owner', 'admin'));

-- ========== property_users ==========
alter table property_users enable row level security;

create policy property_users_select on property_users for select
  using (is_property_member(property_id));

create policy property_users_write on property_users for all
  using (current_property_role(property_id) in ('owner', 'admin'))
  with check (current_property_role(property_id) in ('owner', 'admin'));

-- ========== room_types ==========
alter table room_types enable row level security;

create policy room_types_select on room_types for select
  using (is_property_member(property_id));

create policy room_types_write on room_types for insert
  with check (current_property_role(property_id) in ('owner', 'admin'));

create policy room_types_update on room_types for update
  using (current_property_role(property_id) in ('owner', 'admin'));

create policy room_types_delete on room_types for delete
  using (current_property_role(property_id) in ('owner', 'admin'));

-- ========== rooms ==========
alter table rooms enable row level security;

create policy rooms_select on rooms for select
  using (is_property_member(property_id));

create policy rooms_insert on rooms for insert
  with check (current_property_role(property_id) in ('owner', 'admin'));

-- status changes (available/occupied/cleaning/...) are allowed for any
-- property member, since front_desk and housekeeping both need to update it
create policy rooms_update on rooms for update
  using (is_property_member(property_id));

create policy rooms_delete on rooms for delete
  using (current_property_role(property_id) in ('owner', 'admin'));

-- ========== room_status_log ==========
alter table room_status_log enable row level security;

create policy room_status_log_select on room_status_log for select
  using (exists (
    select 1 from rooms r where r.id = room_status_log.room_id and is_property_member(r.property_id)
  ));

create policy room_status_log_insert on room_status_log for insert
  with check (exists (
    select 1 from rooms r where r.id = room_status_log.room_id and is_property_member(r.property_id)
  ));

-- ========== guests ==========
alter table guests enable row level security;

create policy guests_rw on guests for all
  using (is_property_member(property_id))
  with check (is_property_member(property_id));

-- ========== bookings ==========
alter table bookings enable row level security;

create policy bookings_rw on bookings for all
  using (is_property_member(property_id))
  with check (is_property_member(property_id));

-- ========== booking_charges ==========
alter table booking_charges enable row level security;

create policy booking_charges_rw on booking_charges for all
  using (exists (
    select 1 from bookings b where b.id = booking_charges.booking_id and is_property_member(b.property_id)
  ))
  with check (exists (
    select 1 from bookings b where b.id = booking_charges.booking_id and is_property_member(b.property_id)
  ));

-- ========== payments ==========
alter table payments enable row level security;

create policy payments_rw on payments for all
  using (exists (
    select 1 from bookings b where b.id = payments.booking_id and is_property_member(b.property_id)
  ))
  with check (exists (
    select 1 from bookings b where b.id = payments.booking_id and is_property_member(b.property_id)
  ));

-- ========== tax_settings ==========
alter table tax_settings enable row level security;

create policy tax_settings_select on tax_settings for select
  using (is_property_member(property_id));

create policy tax_settings_write on tax_settings for all
  using (current_property_role(property_id) in ('owner', 'admin'))
  with check (current_property_role(property_id) in ('owner', 'admin'));

-- ========== invoices ==========
alter table invoices enable row level security;

create policy invoices_select on invoices for select
  using (exists (
    select 1 from bookings b where b.id = invoices.booking_id and is_property_member(b.property_id)
  ));

create policy invoices_insert on invoices for insert
  with check (exists (
    select 1 from bookings b where b.id = invoices.booking_id and is_property_member(b.property_id)
  ));
