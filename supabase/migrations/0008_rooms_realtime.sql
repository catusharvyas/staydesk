-- Room board doesn't live-update if another device changes a room's status
-- (noted as a known gap since Phase 2). Adding `rooms` to the realtime
-- publication is the only DB-side change needed — Supabase Realtime's
-- postgres_changes already respects RLS per-connection (rooms_select in
-- 0002_rls.sql), so a client only ever receives change events for rooms in
-- properties they're actually a member of. Default replica identity
-- (primary key) is fine here: the client only needs the `new` row, which
-- postgres_changes always sends in full regardless of replica identity.

alter publication supabase_realtime add table rooms;
