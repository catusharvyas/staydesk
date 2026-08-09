-- 0003 revoked EXECUTE on the RLS helper functions from `anon` to stop them
-- being callable as a public RPC endpoint. That was wrong: RLS policies
-- still need to *invoke* these functions when an anonymous request is
-- evaluated (e.g. a public/unauthenticated select against `rooms`) — without
-- EXECUTE, anon gets a hard 42501 permission error instead of the intended
-- "zero rows" result.
--
-- Correct fix: relocate the helpers out of `public` into a schema PostgREST
-- doesn't expose (default exposed schema is `public` only). That removes
-- the direct-RPC attack surface the advisor flagged, while EXECUTE stays
-- granted to anon/authenticated so RLS keeps evaluating correctly for both.
-- ALTER FUNCTION ... SET SCHEMA relocates the same object (same OID); every
-- existing policy that references these functions keeps working unchanged.

create schema if not exists internal;

alter function is_property_member(uuid) set schema internal;
alter function current_property_role(uuid) set schema internal;

grant usage on schema internal to anon, authenticated;
grant execute on function internal.is_property_member(uuid) to anon, authenticated;
grant execute on function internal.current_property_role(uuid) to anon, authenticated;
