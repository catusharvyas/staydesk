-- Onboarding bootstrap problem: a brand-new user can't INSERT into
-- organizations/properties/property_users directly under RLS, because
-- ownership of a property is exactly what those policies gate on — and
-- there's no property yet for them to own. Rather than widen RLS with a
-- generic "any authenticated user can INSERT a property" policy (which
-- would let anyone attach rows to arbitrary orgs), this function does the
-- whole org+property+owner+tax_settings bootstrap atomically as one
-- SECURITY DEFINER call, scoped to auth.uid() and one-shot per user.

create or replace function bootstrap_property(
  p_org_name text,
  p_property_name text,
  p_state_code text default null,
  p_gstin text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_property_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to create a property';
  end if;

  if exists (select 1 from property_users where user_id = auth.uid()) then
    raise exception 'User already belongs to a property';
  end if;

  insert into organizations (name) values (p_org_name) returning id into v_org_id;

  insert into properties (org_id, name, state_code, gstin)
  values (v_org_id, p_property_name, nullif(p_state_code, ''), nullif(p_gstin, ''))
  returning id into v_property_id;

  insert into property_users (property_id, user_id, role)
  values (v_property_id, auth.uid(), 'owner');

  insert into tax_settings (property_id) values (v_property_id);

  return v_property_id;
end;
$$;

revoke execute on function bootstrap_property(text, text, text, text) from public, anon;
grant execute on function bootstrap_property(text, text, text, text) to authenticated;
