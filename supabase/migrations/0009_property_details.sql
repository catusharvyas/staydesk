-- Property identity/legal details, for the new /settings/property page.
--
-- Why this exists: `properties.address` has been rendered on both the HTML
-- invoice and the PDF invoice since Phase 6, but nothing ever captured it —
-- onboarding doesn't ask, and no code path writes to `properties` at all
-- after bootstrap_property. So every invoice issued so far has a blank
-- address line, which a GST tax invoice legally requires. This migration
-- adds the remaining identity columns; the settings page adds the write path.
--
-- Placement note: PAN and CIN are strictly *entity*-level identifiers (they
-- belong to the legal entity, i.e. `organizations`), while GSTIN is
-- state/registration-level and already lives on `properties`. They're put on
-- `properties` here anyway, deliberately: the property is this app's only
-- invoicing unit, `properties_update` RLS already gates writes to owner/admin,
-- and `getCurrentProperty()` already loads the whole row for every request.
-- Splitting entity data onto `organizations` only pays off once one org
-- genuinely invoices from multiple properties — which is a broader product
-- decision (see PROJECT.md §8's open "single-property vs. group/chain" item),
-- not something to pre-build here.

alter table properties
  add column legal_name text,   -- registered legal entity; falls back to name on invoices
  add column pan text,          -- entity-level, 10 chars (ABCDE1234F)
  add column cin text;          -- entity-level, 21 chars; only registered companies have one

comment on column properties.legal_name is
  'Registered legal entity name. Invoices print this when set, falling back to properties.name (the trading/brand name guests see).';
comment on column properties.pan is
  'Permanent Account Number of the legal entity. Entity-level — see 0009 migration header for why it sits on properties.';
comment on column properties.cin is
  'Corporate Identification Number. Optional — only registered companies have one (proprietorships/partnerships do not).';
