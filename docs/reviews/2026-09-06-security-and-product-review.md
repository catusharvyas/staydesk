# StayDesk — end-to-end review (security, correctness, hotel-domain gaps)

Date: 2026-09-06 · Scope: full repository at commit `e48245c` plus the live Supabase project (`znieiphiixdzjrkaozlb`) · Method: source review of every route, server action, query module and migration; `tsc`, `eslint`, `next build`, `npm audit`; Supabase management API (project status, advisors). No changes were made to application code.

---

## 0. Executive summary

**What is good.** Tenant isolation is designed the right way: every operational table carries `property_id`, RLS is enabled everywhere, the helper functions were moved out of the PostgREST-exposed schema, onboarding goes through a scoped `SECURITY DEFINER` bootstrap, double-booking is prevented by a DB exclusion constraint rather than UI logic, the service worker no longer caches per-tenant pages, and pricing math lives in exactly one module. `tsc`, `eslint` and `next build` are clean.

**What blocks production use.** Seven items, in priority order:

| # | Finding | Severity |
|---|---|---|
| 1 | The live Supabase project is **INACTIVE (paused)**. The app is currently down, and the "0 advisor warnings" result is meaningless while paused. Free tier also has **no database backups**. | Critical (availability / data-loss) |
| 2 | **No sign-out anywhere and no idle timeout.** On a shared front-desk PC, any walk-up has full access for the life of the refresh token. | High |
| 3 | **Role model is not enforced on financial and guest-PII tables.** `bookings`, `guests`, `payments`, `booking_charges` are `FOR ALL` to every member, including `housekeeping`. Payments can be deleted, discounts changed and Aadhaar numbers read by any staff JWT. | High |
| 4 | **Admin privilege escalation** via `property_users_write` (an admin can make themselves owner or remove the owner). | High |
| 5 | **Cross-tenant reference integrity**: single-column FKs let a member of property A insert a booking pointing at property B's room (or a room pointing at B's room type). RLS hides the read, but the exclusion constraint still blocks B's room. | Medium-High |
| 6 | **GST engine is structurally wrong for hotels**: slab is chosen on total stay value instead of per-unit-per-night value, ancillary charges are pooled into the accommodation slab, default rates (12/18) predate the 22-Sep-2025 rationalisation (5/18), invoice lacks SAC, B2B recipient GSTIN, FY-scoped numbering and credit notes. | High (tax exposure) |
| 7 | **"Today" and report periods are computed in UTC**, not the property's `Asia/Kolkata` timezone. Between 00:00 and 05:30 IST the dashboard, room-board flips and GST period boundaries are all one day off. | High (operational + tax period) |

Everything else (bugs, missing features, roadmap) follows.

---

## 1. Security and data-breach assessment

Severity scale: Critical / High / Medium / Low. "Exploitability" assumes an attacker who is an authenticated member of *some* property (the realistic insider or ex-staff threat model for a multi-tenant PMS), unless stated.

### 1.1 Critical

**S-1. Production backend is paused; no backups.**
`get_project` returns `status: INACTIVE`. Free-tier projects pause after inactivity and have no scheduled backups or PITR. Guest identity data and tax invoices are legal records; the plan does not match the data class.
*Fix:* restore the project, upgrade to Pro before any real guest is entered, enable PITR, and script a nightly `pg_dump` to owner-controlled storage as a second copy.

### 1.2 High

**S-2. No sign-out, no session timeout, no device management.**
`grep signOut src` returns nothing. The session cookie is refreshed on every request by `src/proxy.ts`, so it never expires while the tab is used. Hotels run shared terminals across three shifts.
*Fix:* sign-out in the header and the "More" tab; idle auto-lock (PIN re-entry) after N minutes for `front_desk`/`housekeeping`; shorten refresh-token lifetime in Supabase Auth; "sign out everywhere" for owners; optional MFA for `owner`/`admin`.

**S-3. RLS does not implement the role model that PROJECT.md §3 describes.**
Policies in `0002_rls.sql`:

| Table | Policy | Who | Effect |
|---|---|---|---|
| `bookings` | `bookings_rw FOR ALL` | any member | housekeeping can delete bookings, set `rate_override`/`discount` to 0 |
| `payments` | `payments_rw FOR ALL` | any member | any staff can **delete or edit** a recorded payment (cash-skimming path) |
| `booking_charges` | `FOR ALL` | any member | charges can be removed after being consumed |
| `guests` | `guests_rw FOR ALL` | any member | housekeeping can read every guest's ID-proof number, phone, address |
| `room_status_log` | insert for any member | any member | audit trail can be forged (arbitrary from/to rows) |

App-level checks exist only for room master, property settings and tax settings. Everything else is reachable with the browser's anon key plus the user's own JWT, no UI needed.
*Fix:* (a) make `payments`, `invoices`, `booking_charges` **append-only** (SELECT + INSERT only; corrections are reversal rows); (b) restrict `bookings` UPDATE of `rate_override`/`discount` to owner/admin via a column-level check or a dedicated RPC; (c) restrict `guests` SELECT of `id_proof_number`/`address` to `front_desk`+ (a view for housekeeping); (d) no DELETE on `bookings` (use `cancelled`); (e) write `room_status_log` from a trigger, not from the client.

**S-4. Admin → owner escalation and owner lock-out.**
`property_users_write FOR ALL` is granted to `owner` *and* `admin` with no restriction on the target row. An admin can `update property_users set role='owner' where user_id = auth.uid()` or delete the owner's row. There is no UI for this yet, which is exactly why it will be forgotten when one is added.
*Fix:* only `owner` may grant/revoke `owner`/`admin`; a user may never modify their own membership row; trigger that refuses to remove the last owner.

**S-5. Cross-tenant foreign keys are not constrained to the same property.**
`bookings.room_id → rooms(id)`, `bookings.guest_id → guests(id)`, `rooms.room_type_id → room_types(id)` are single-column. `createBooking`, `editBooking` and `createRoom` pass the form's UUID straight through. `bookings_rw WITH CHECK` only verifies `property_id`, so a member of A can insert a booking in A that references B's room. Consequences: B's room is blocked for those dates by `no_overlapping_bookings` (availability denial across tenants); A's booking shows a blank room; a room pointing at B's room type prices at ₹0 because the RLS-filtered join returns null. Requires knowing B's UUIDs, which S-8 leaks partially.
*Fix:* `unique (id, property_id)` on `rooms`, `guests`, `room_types`, then composite FKs `(room_id, property_id) references rooms(id, property_id)` etc.; keep the server-action pre-checks as defence in depth.

**S-6. Guest PII at rest and in transit inside the app.**
`guests.id_proof_number` (Aadhaar, passport, PAN), phone, email, address are plaintext, unmasked in the UI, readable by every role, with no access log, retention rule or erasure path. Hotels are data fiduciaries under the DPDP Act 2023; UIDAI guidance is not to store full Aadhaar numbers (mask to last 4 or use a vault).
*Fix:* store masked value plus an encrypted full value (Supabase Vault / `pgsodium`) or only the last 4 + an image of the document in a **private** bucket with signed URLs; role-gated reveal with an access-log row; retention policy (e.g. purge ID data N years after checkout); guest data export/delete for DPDP requests.

**S-7. Open self-service signup with no staff-invitation model.**
Anyone who finds the URL can create an account and a property. That is acceptable for a SaaS funnel, but: email confirmation is only a dashboard toggle (code tolerates both), there is no CAPTCHA/rate limit beyond Supabase defaults, password policy is a client-side `minLength=6`, and there is **no way to add a second user** except SQL. Every hotel needs several logins, so today the product is single-user in practice.
*Fix:* invitation table + `invite_user` RPC (owner/admin), accept-invite flow, deactivate/remove member, role change UI; server-side password policy; enforce email confirmation in code (refuse `signInWithPassword` for unconfirmed users if the dashboard setting is ever relaxed).

### 1.3 Medium

**S-8. Public logo bucket allows anonymous listing of all tenants' folders.**
`property_logos_read FOR SELECT USING (bucket_id='property-logos')` with no `TO` clause. Public buckets serve `/object/public/...` without a policy; the SELECT policy is what enables `storage.from().list()`, and it is granted to `anon`. Result: enumerate every `property_id` in the system (feeds S-5).
*Fix:* drop the SELECT policy (public read still works), or scope it to members. Consider a random path segment instead of the raw property id.

**S-9. PostgREST filter injection in guest search.**
`src/lib/queries/guests.ts` builds `.or(\`name.ilike.%${search}%,phone.ilike.%${search}%\`)` from the query string. Commas, parentheses and dots are grammar characters, so a user can append arbitrary filter clauses (e.g. filter on `id_proof_number` prefix) and normal searches containing a comma fail. Bounded by RLS (same tenant), so not a cross-tenant breach, but it is an injection primitive.
*Fix:* escape the term (or reject grammar characters), or move search to an RPC with a parameter / `websearch_to_tsquery`.

**S-10. Invoice number allocation is directly callable and burns numbers.**
`next_invoice_number(uuid)` is `GRANT EXECUTE TO authenticated` and increments on every call. Any member can call it via `supabase.rpc` and create gaps; `generateInvoiceForBooking` also calls it *before* the insert, so a failed insert burns a number. GST Rule 46 requires a consecutive series per FY.
*Fix:* allocate inside the insert path (a `generate_invoice(booking_id)` RPC that does numbering + insert in one transaction, or a `BEFORE INSERT` trigger), and revoke direct execute.

**S-11. Non-atomic state transitions.**
Check-in, check-out and cancel each run 3–5 separate statements from the server action (booking update, room update, log insert, invoice generation). A failure mid-way leaves a booking `checked_out` with the room `occupied`, or an invoice missing. Financial workflows should be Postgres functions running in one transaction with the role check inside.

**S-12. Raw database error strings are returned to the browser.**
Almost every action returns `error.message` from PostgREST/Postgres, exposing constraint and column names. Map known codes (`23P01`, `23505`, `42501`) to friendly text and log the rest server-side.

**S-13. No HTTP security headers.**
`next.config.ts` is empty: no CSP, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`. Vercel adds HSTS on its own domains only.

**S-14. No audit trail for financial or guest data.**
Only `room_status_log` exists. There is no record of who applied a discount, edited a guest, recorded/deleted a payment, or generated an invoice. Add `created_by`/`updated_by` plus an append-only `audit_log` written by triggers.

**S-15. Dependency and build hygiene.**
`npm audit --omit=dev`: 2 high (`fast-uri`, `nanoid`), 1 moderate (`qs`), all transitive, fix available. `npm ci` fails (lockfile/CLI mismatch), so builds are not reproducible; there is no CI, no test suite, no `.github`. `src/lib/pricing.ts` is an ideal first unit-test target.

### 1.4 Low / informational

- `getCurrentProperty` uses `.limit(1)` with no ordering: a multi-property user lands in an arbitrary property, and every write goes there. When property switching arrives it must be explicit (server-side cookie), never inferred.
- `bootstrap_property` is one-shot per user; once invitations exist, an invited staff member can never create their own property. Decide whether that is intended.
- `proxy.ts` matcher excludes any path ending in an image extension, so `/guests/x.png` bypasses the redirect. Pages still self-check, so this is harmless today.
- Realtime on `rooms` respects RLS per subscriber; the client filter is a convenience, not the boundary. Correct.
- Service worker: network-only for navigations and RSC; safe. `/offline` precache is fine.
- No secrets in the repo. PROJECT.md contains the project ref and URL only (public by nature). `SUPABASE_SERVICE_ROLE_KEY` is never read by code; keep it that way.

---

## 2. Things that do not work or need improvement

### 2.1 Timezone (systemic)
`new Date().toISOString().slice(0,10)` is used for "today" in `createBooking`, `cancelBooking`, `editBooking`, `getDashboardStats`, `listTodayArrivals`, `reports/page.tsx`. `properties.timezone` (`Asia/Kolkata`) is never read. Between 00:00 and 05:30 IST the app believes it is yesterday: arrivals/departures cards are wrong, a same-day booking does not flip the board to `reserved`, cancelling does not release the room. Night shift is when this bites.
Reports compare `received_at >= 'YYYY-MM-DD'` and `< 'YYYY-MM-DDT23:59:59'` as UTC: payments between 00:00 and 05:30 IST fall into the previous day, so the **monthly GST summary and collections report do not align with the Indian tax period**; the last second of the day is also excluded.
*Fix:* one `todayInProperty(tz)` helper; convert report boundaries to `[from 00:00 tz, to+1 00:00 tz)` in UTC; store `business_date` on payments/invoices at write time.

### 2.2 GST computation (material)
1. **Slab basis.** `selectGstRate` compares the whole stay's taxable value with ₹7,500. The rate for accommodation depends on the value of supply **per unit per day**. Three nights at ₹3,000 (₹9,000) is taxed at 18% by the app; it should be the lower slab. Use the effective per-night rate (`rate_override ?? base_rate`, less per-night discount).
2. **Ancillary charges pooled into the room slab.** `booking_charges.taxable` is a boolean; food, laundry, extra bed, transport carry their own SAC and rates and must be separate lines with their own rate. They must also not push the *accommodation* line into the higher slab.
3. **Stale defaults.** `tax_settings` seeds 12%/18%. From 22 Sept 2025 accommodation ≤ ₹7,500/night is 5% (without ITC) and > ₹7,500 is 18%. New properties will invoice at the wrong rate until someone edits settings.
4. **No effective-dating.** Rates change mid-month; a single current-rate row cannot reproduce an old invoice. Model `tax_rates(sac, effective_from, threshold, rate)` and resolve by supply date.
5. **IGST toggle is a foot-gun.** Place of supply for lodging is the hotel's location (IGST Act s.12(3)(b)); it is always CGST+SGST for room revenue, even for an out-of-state B2B recipient. Remove the toggle for accommodation lines.
6. **Invoice content.** Missing: SAC (996311), per-line rate, recipient GSTIN/legal name/address for B2B (needed for the recipient's ITC and your GSTR-1 B2B table), place of supply, reverse-charge flag, authorised signatory, FY-scoped consecutive number (`INV-0001` never resets and has no FY prefix; Rule 46, max 16 chars). Rounding under s.170 is per tax amount, not on the grand total only.
7. **No credit note / cancellation.** `invoices` is immutable (correct) but there is no reversal document, so a wrong invoice can never be fixed lawfully.
8. **Snapshot is incomplete.** The invoice row freezes totals, but the PDF and HTML recompute `roomCharge = taxable_value − live taxable charges` and list *live* charges and payments. Add a charge after invoicing and the printed lines no longer add up to the frozen total. Freeze line items in an `invoice_lines` table at generation time.
9. **Early / late checkout.** Billing always uses `check_out_planned`; an early departure is charged full nights and there is no way to shorten a stay. No late-checkout charge, no no-show handling, no day-use.

### 2.3 Booking workflow
- `extendStay` has no status check (works on cancelled/checked-out bookings) and no "new date > check-in" check.
- `checkOutBooking` does not warn or gate on an unpaid balance.
- `checkInBooking` ignores room status (`maintenance`, `cleaning`, occupied by another) and planned date.
- Room board status is a stored field only flipped at booking creation if `check_in == today`; a booking made yesterday for today never shows `reserved`. Derive board state from bookings + housekeeping state, or run a day-roll job.
- `listAvailableRooms` ignores `rooms.status`, so `maintenance`/`cleaning` rooms are offered (already noted by the developer).
- Quick-add guest in the booking form always inserts a new `guests` row, even when the phone already exists → duplicates.
- Bookings page issues one availability query per reserved booking (N+1). Fine today, will not scale to a 60-room hotel with a full month of reservations.
- `getMonthOccupancy` uses all rooms (including out-of-order) as the denominator.
- Invoice is reachable only from the Bookings list after checkout; nothing links from the checkout success state or the room page.

### 2.4 Platform
- `npm ci` fails; no CI; no tests; `npm audit` findings (see S-15).
- No monitoring/error reporting (Sentry or equivalent); `console.error` on invoice failure is the only signal.
- Reports label payments received as "Revenue"; it is collections (cash basis). Keep both views.

---

## 3. Important features that are missing (hotel-industry lens)

### 3.1 Legal and compliance (India) — must-have before real guests
1. **Guest register (arrival/departure register).** State police rules require a register of every guest with ID details, exportable on demand. The data exists; the register view, export and immutability do not.
2. **Form C for foreign nationals** (FRRO, within 24 h of arrival): passport number, visa number/type, date of arrival in India, purpose, next destination. Only `nationality` exists.
3. **ID document capture** (image, private bucket, signed URLs, retention), not just a typed number.
4. **GST compliance package**: items in §2.2 plus a **GSTR-1 export** (B2B, B2CS, HSN/SAC summary) and credit-note register.
5. **DPDP Act 2023**: consent notice at check-in, purpose limitation, retention schedule, erasure/export on request, breach log.
6. **Audit trail** across bookings, payments, discounts, guest edits, settings changes (S-14).

### 3.2 Core operations — expected in any PMS
7. **Staff management**: invite, roles, deactivate, reset password, shift/PIN lock; **property switcher** for owners of more than one property.
8. **Occupancy and guests per booking**: adults/children, additional guests (each needs ID for the register), `extra_bed_rate` and `max_occupancy` exist in the schema but are unused.
9. **Rate management**: seasonal/weekday/weekend rates, rate plans and meal plans (EP/CP/MAP/AP), corporate/agent rates, per-night rate overrides.
10. **Payments lifecycle**: advance at reservation, deposits, refunds and reversals (append-only), cancellation policy and charges, no-show, partial settlements, payment against a **folio** rather than a booking.
11. **Folio and billing**: split bills, company/B2B billing with GSTIN, city ledger (credit accounts), posting of F&B/laundry/other POS charges with SAC.
12. **Housekeeping module**: room task list, DND, out-of-order with a **date range** (so availability respects it), maintenance tickets, minibar posting.
13. **Night audit / day close**: lock the business date, cash-drawer reconciliation by payment mode, shift handover report.
14. **Booking source and channel**: walk-in / phone / OTA / agent with commission, at minimum a `source` field; later, channel-manager or OTA sync and a booking widget.
15. **Guest communication**: confirmation and invoice by WhatsApp/email/SMS; pre-arrival details link.

### 3.3 Reporting and analytics
16. Occupancy % over a range (room-nights sold / available), ADR, RevPAR, daily flash report, arrivals/departures/in-house lists printable for the desk, collections by mode with reconciliation, outstanding by ageing, police-register and GST exports to CSV/Excel.

### 3.4 Platform and reliability
17. Backups/PITR (S-1), staging environment, CI with `tsc`/lint/tests/`next build`, Sentry, uptime monitoring, rate limiting on auth, security headers (S-13), documented restore drill.

---

## 4. Suggested sequencing

**Phase 0 — before any real guest data (1–2 weeks).**
Restore and upgrade Supabase, backups; sign-out + idle lock; tighten RLS for payments/charges/invoices (append-only), bookings pricing fields and guest PII; owner-only membership changes and last-owner guard; composite FKs; timezone helper and business-date columns; invitation flow; drop anonymous bucket listing; escape guest search; map DB errors; security headers; `npm audit fix`; CI.

**Phase 1 — GST correctness (2–3 weeks).**
Effective-dated tax-rate table seeded with 5/18 from 22-Sep-2025 and 12/18 before; per-night slab selection; per-line SAC and rate on charges; `invoice_lines` snapshot; FY-scoped numbering allocated inside a single `generate_invoice` transaction; B2B recipient fields; credit notes; per-component rounding; remove IGST toggle for accommodation; GSTR-1 export. Unit tests for `pricing.ts` covering the slab boundary, multi-night, mixed-rate lines and the 2025 rate change date.

**Phase 2 — compliance and control (2–3 weeks).**
Guest register + Form C fields and export; ID image capture in a private bucket; audit-log triggers; night audit/day close; DPDP retention and erasure.

**Phase 3 — operations depth.**
Rate plans and seasons, occupancy/extra guests, folios and split billing, housekeeping module with date-ranged out-of-order, booking source, guest messaging, KPI reports.

**Architecture principle to carry through all phases** (consistent with the metadata-driven approach you use in compliance systems): treat tax as a versioned rule table resolved by supply date, not constants; treat every financial state transition as a Postgres function that is transactional and role-checked inside the database, with the Next.js action reduced to validation and presentation. That gives you one enforcement point (the DB) for both tenancy and role, which is the property the current design already aims for but only half delivers.

---

## Appendix A — verification performed

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run lint` | clean |
| `next build` (placeholder env) | success, 17 dynamic routes, proxy compiled |
| `npm ci` | fails (usage/lockfile mismatch); `npm install` succeeds |
| `npm audit --omit=dev` | 2 high, 1 moderate, transitive, fix available |
| Supabase `get_project` | `status: INACTIVE` |
| Supabase advisors (security, performance) | empty — not meaningful while paused |
| Supabase SQL (policy dump, row counts) | connection timeout (paused) |

## Appendix B — files most relevant to each finding

- Tenancy/RLS: `supabase/migrations/0002_rls.sql`, `0004_fix_rls_helper_exposure.sql`, `0006_invoice_numbering.sql`, `0010_property_logo.sql`
- Auth/session: `src/proxy.ts`, `src/app/(auth)/login/actions.ts`, `src/lib/property.ts`
- Booking workflow: `src/app/(app)/bookings/actions.ts`, `src/app/(app)/bookings/pricing-actions.ts`, `src/lib/queries/bookings.ts`
- Tax/invoice: `src/lib/pricing.ts`, `src/lib/invoicing.ts`, `src/lib/invoice-pdf.tsx`, `src/app/(app)/bookings/[bookingId]/invoice/pdf/route.ts`
- Reports/timezone: `src/lib/queries/reports.ts`, `src/lib/queries/dashboard.ts`, `src/app/(app)/reports/page.tsx`
- Guest search: `src/lib/queries/guests.ts`
