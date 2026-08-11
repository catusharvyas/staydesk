-- Guest form validation pass (post-V1): adds a nationality field. Deliberately
-- kept minimal — a plain text column, no default enforced at the DB level
-- (matches every other optional guest field; "Indian" is a UI-level
-- pre-fill, not a schema default). This is informational only, not the
-- start of FRRO/Form-C foreign-guest legal reporting (passport/visa detail
-- tracking) — that's a separately-scoped feature if it's ever actually
-- needed, not something to half-build speculatively here.

alter table guests add column if not exists nationality text;
