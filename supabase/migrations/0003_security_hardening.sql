-- Addresses Supabase security-advisor warnings surfaced right after
-- 0001/0002 were applied:
--   - function_search_path_mutable on both RLS helper functions
--   - extension_in_public (btree_gist)
--   - anon_security_definer_function_executable on both helpers
--     (authenticated keeps EXECUTE — RLS policies evaluate as the calling
--     role even for SECURITY DEFINER functions, so revoking it there would
--     break every policy that calls these helpers)

create or replace function is_property_member(p_property_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
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
set search_path = public
as $$
  select role from property_users pu
  where pu.property_id = p_property_id
    and pu.user_id = auth.uid()
  limit 1;
$$;

revoke execute on function is_property_member(uuid) from public, anon;
revoke execute on function current_property_role(uuid) from public, anon;
grant execute on function is_property_member(uuid) to authenticated;
grant execute on function current_property_role(uuid) to authenticated;

-- Supabase projects ship an `extensions` schema for exactly this; it's on
-- the default search_path so the exclusion constraint on bookings keeps
-- resolving btree_gist's gist operator classes without changes.
create schema if not exists extensions;
alter extension btree_gist set schema extensions;
