# Marketplace migration preflight

**Current decision: DO NOT APPLY YET.** This checklist is for a future,
authorized review. It is not evidence that the migration has been run or that
any live database was inspected.

No SQL in this document was executed during this review. The SQL examples below
are read-only evidence templates for an authorized operator to adapt and run
against a protected, isolated copy or an approved read-only inspection session.
Do not export customer identifiers, addresses, emails, cart contents, or other
unnecessary personal data. Prefer aggregate counts and redacted conflict
reports.

## What local source establishes

The repository source establishes application intent, not the deployed
database state:

- The frontend calls `get_available_partner_bookings()` and
  `get_partner_bookings()` without arguments, and calls
  `update_partner_booking_status(p_booking_id, p_status)`.
- The partner service expects `id`, `service_name`, `service_slug`,
  `category_slug`, `booking_date`, `booking_time`, `total_amount`, and
  `status` in its `PartnerJob` shape. The current migration and reference
  schema define the available-bookings RPC with those columns.
- The checkout UI calls `create_order_from_cart(p_address_id,
  p_checkout_attempt_id)`. The previous one-argument RPC is retained only as a
  fail-closed compatibility stub and has no authenticated execute grant.
- The client derives a stable UUID-shaped attempt ID from the authenticated
  customer, saved address ID, and sorted product/quantity snapshot. The RPC
  stores it on `orders.checkout_attempt_id`, protected by a unique index, and
  returns the existing order for retries. This is implemented in local source,
  but has not been tested against PostgreSQL or the deployed schema.
- Checkout reuses a matching saved address in the current address list and
  remembers a newly saved address during the current page session. Address
  retry behavior across browser reloads still depends on matching the fetched
  saved-address fields.
- Checkout text explicitly states payment is not collected and processing is
  not configured.
- The migration source contains preflight checks for legacy carts, constraints,
  indexes, RLS, grants, functions, and triggers. Those checks have not been
  executed against any database.
- `supabase/schema.sql` is repository reference code, **not** a verified
  schema/data snapshot of a deployed project.

The local code cannot establish the live columns, rows, catalog definitions,
grants, policies, deployed RPC return type, trigger bodies, extensions, or
Supabase-managed objects. Obtain that evidence from an authorized database
inspection before migration.

## Preflight checklist

| # | Check | Evidence required before migration | Source code vs. database |
|---|---|---|---|
| 1 | Legacy carts and mappings | Confirm whether `public.cart` exists; compare aggregate counts for legacy carts, target carts, and cart items; find duplicate IDs/owners, owners absent from profiles, conflicting same-owner/different-ID and same-ID/different-owner mappings, and cart items that reference neither table. Resolve every conflict explicitly; do not merge or delete rows automatically. Freeze cart writes during the final check-and-migrate window or otherwise demonstrate a race-safe operational procedure. | The migration contains guarded checks and an `ON CONFLICT (user_id) DO NOTHING` header copy. Only the database can establish current rows and whether they change during migration. |
| 2 | Foreign keys | For each FK on affected tables, record child and parent columns, referenced schema/table, `ON DELETE`, `ON UPDATE`, match type, deferrability, validation state, and full definition. Confirm only the exact verified `cart_items.cart_id → cart.id` relationship is a legacy FK candidate; identify all other FKs and any duplicate or unexpected definitions. | The migration declares intended references and catalog checks. Actual definitions and validation state require the target catalog. |
| 3 | Indexes | For indexes on `carts`, `cart_items`, and all migration-managed tables, record index definition, table, access method, key columns/order, uniqueness, predicate/expression, validity, readiness, and constraint ownership. Confirm no same-name wrong object and no equivalent differently named unique index that migration logic overlooks. | The migration checks several named/equivalent indexes. Only catalog inspection establishes deployed indexes. |
| 4 | Status constraints and rows | Aggregate booking status, order status, and payment-status counts, including nulls and values outside the intended sets. Record CHECK definitions, referenced columns, validation state, nullability, and any multiple/combined CHECK constraints. Reconcile invalid values manually; never rewrite rows just to make migration pass. | The migration contains expected sets and a constraint preflight. Existing rows and constraints require the database. |
| 5 | RLS and table privileges | Export `pg_policies` definitions and RLS/force-RLS flags for all touched tables. Enumerate grants, including inherited role membership and grants to `PUBLIC`, `anon`, `authenticated`, service roles, owners, and custom roles. Confirm effective access for customer, partner, administrator, and service-role workflows, including legacy-cart and storage policies. | Repository policy/grant SQL describes intended rules. Deployed policies, grants, role memberships, and effective privileges require database inspection. |
| 6 | Functions and dependencies | For each named RPC/helper/trigger function, record exact input types, result type, overloads, owner, `SECURITY DEFINER`, `search_path`/`proconfig`, language, volatility, ACLs, and dependencies (views, policies, triggers, other functions, application clients). Identify every overload and explicit role grant before any revoke or replacement. For checkout, verify the new two-UUID signature and identify deployed callers of the deprecated one-UUID signature; those callers will fail closed after migration. | Frontend calls are locally searchable. Deployed definitions, overloads, ACLs, and dependencies require the database. |
| 7 | Triggers | Record each trigger's relation, full `pg_get_triggerdef`, event/timing, enabled state, update columns, condition, arguments, constraint association, function OID/name, and function body. Identify unknown, disabled, equivalent, or duplicate triggers and verify notification side effects before accepting or replacing any trigger. | Migration checks catalog identity/shape and known legacy function names. The live trigger catalog and actual function bodies require inspection. |
| 8 | Schema drift and Supabase prerequisites | Compare every referenced table/column/type/nullability/default/constraint with the migration's required-column list and function bodies. Verify `auth.users`, `auth.uid()`, roles, `pgcrypto`, `storage.buckets`, `storage.objects`, `storage.foldername`, and `supabase_realtime` publication availability/ownership as applicable. Identify extensions, grants, policies, and custom objects that `CREATE TABLE IF NOT EXISTS` will not reconcile. | Local migration and reference schema show assumptions. Only a target schema snapshot/catalog can verify compatibility. |

### Read-only evidence templates

Adapt to confirmed object existence first. These examples are `SELECT` queries;
they intentionally avoid returning cart contents or customer identifiers.

**Cart aggregate and conflicts** (run only after confirming all referenced
tables and columns exist):

```sql
SELECT 'legacy_cart_rows' AS metric, count(*)::bigint AS value FROM public.cart
UNION ALL
SELECT 'target_cart_rows', count(*)::bigint FROM public.carts
UNION ALL
SELECT 'cart_item_rows', count(*)::bigint FROM public.cart_items;

SELECT 'legacy_duplicate_ids' AS metric, count(*)::bigint AS groups
FROM (SELECT id FROM public.cart GROUP BY id HAVING count(*) > 1) q
UNION ALL
SELECT 'legacy_null_ids', count(*)::bigint FROM public.cart WHERE id IS NULL
UNION ALL
SELECT 'legacy_null_owners', count(*)::bigint FROM public.cart WHERE user_id IS NULL
UNION ALL
SELECT 'legacy_duplicate_owners', count(*)::bigint
FROM (SELECT user_id FROM public.cart GROUP BY user_id HAVING count(*) > 1) q
UNION ALL
SELECT 'legacy_owners_missing_profiles', count(*)::bigint
FROM public.cart old
LEFT JOIN public.profiles p ON p.user_id = old.user_id
WHERE p.user_id IS NULL
UNION ALL
SELECT 'target_null_ids_or_owners', count(*)::bigint
FROM public.carts WHERE id IS NULL OR user_id IS NULL
UNION ALL
SELECT 'target_duplicate_ids', count(*)::bigint
FROM (SELECT id FROM public.carts GROUP BY id HAVING count(*) > 1) q
UNION ALL
SELECT 'target_duplicate_owners', count(*)::bigint
FROM (SELECT user_id FROM public.carts GROUP BY user_id HAVING count(*) > 1) q
UNION ALL
SELECT 'target_owners_missing_profiles', count(*)::bigint
FROM public.carts current
LEFT JOIN public.profiles p ON p.user_id = current.user_id
WHERE p.user_id IS NULL
UNION ALL
SELECT 'legacy_target_owner_id_conflicts', count(*)::bigint
FROM public.cart old
JOIN public.carts current ON current.user_id = old.user_id
WHERE current.id <> old.id
UNION ALL
SELECT 'legacy_target_id_owner_conflicts', count(*)::bigint
FROM public.cart old
JOIN public.carts current ON current.id = old.id
WHERE current.user_id <> old.user_id
UNION ALL
SELECT 'orphaned_cart_item_cart_ids', count(*)::bigint
FROM public.cart_items ci
LEFT JOIN public.cart old ON old.id = ci.cart_id
LEFT JOIN public.carts current ON current.id = ci.cart_id
WHERE old.id IS NULL AND current.id IS NULL
UNION ALL
SELECT 'orphaned_cart_item_products', count(*)::bigint
FROM public.cart_items ci
LEFT JOIN public.products p ON p.id = ci.product_id
WHERE p.id IS NULL
UNION ALL
SELECT 'invalid_cart_item_keys_or_quantity', count(*)::bigint
FROM public.cart_items
WHERE cart_id IS NULL OR product_id IS NULL
   OR quantity IS NULL OR quantity <= 0
UNION ALL
SELECT 'duplicate_cart_product_groups', count(*)::bigint
FROM (
  SELECT cart_id, product_id
  FROM public.cart_items
  GROUP BY cart_id, product_id
  HAVING count(*) > 1
) q;
```

**Foreign keys and validation state:**

```sql
SELECT con.conname,
       child_ns.nspname AS child_schema,
       child.relname AS child_table,
       parent_ns.nspname AS parent_schema,
       parent.relname AS parent_table,
       con.convalidated,
       con.condeferrable,
       con.condeferred,
       pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con
JOIN pg_class child ON child.oid = con.conrelid
JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
JOIN pg_class parent ON parent.oid = con.confrelid
JOIN pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
WHERE con.contype = 'f'
  AND child_ns.nspname IN ('public', 'auth')
  AND child.relname IN (
    'cart', 'carts', 'cart_items', 'profiles', 'addresses',
    'bookings', 'orders', 'order_items', 'partner_profiles'
  )
ORDER BY child_ns.nspname, child.relname, con.conname;
```

**Index definitions and state:**

```sql
SELECT tbl.relname AS table_name,
       idx.relname AS index_name,
       am.amname AS access_method,
       i.indisunique,
       i.indisvalid,
       i.indisready,
       i.indnatts,
       i.indnkeyatts,
       pg_get_expr(i.indpred, i.indrelid) AS predicate,
       pg_get_indexdef(i.indexrelid) AS definition
FROM pg_index i
JOIN pg_class tbl ON tbl.oid = i.indrelid
JOIN pg_class idx ON idx.oid = i.indexrelid
JOIN pg_am am ON am.oid = idx.relam
JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
WHERE ns.nspname = 'public'
  AND tbl.relname IN ('cart', 'carts', 'cart_items', 'bookings', 'orders')
ORDER BY tbl.relname, idx.relname;
```

**Status value counts** (aggregate only):

```sql
SELECT 'bookings.status' AS field, status::text AS value, count(*)::bigint AS rows
FROM public.bookings GROUP BY status::text
UNION ALL
SELECT 'orders.status', status::text, count(*)::bigint
FROM public.orders GROUP BY status::text
UNION ALL
SELECT 'orders.payment_status', payment_status::text, count(*)::bigint
FROM public.orders GROUP BY payment_status::text
ORDER BY field, value;
```

Also inspect `pg_constraint` CHECK definitions and `information_schema.columns`
nullability; value counts alone do not establish constraint compatibility.

**Policies and explicit table grants:**

```sql
SELECT schemaname, tablename, policyname, permissive, roles,
       cmd, qual, with_check
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

SELECT grantee, table_schema, table_name, privilege_type, is_grantable
FROM information_schema.table_privileges
WHERE table_schema IN ('public', 'storage')
  AND table_name IN (
    'profiles', 'addresses', 'cart', 'carts', 'cart_items',
    'partner_profiles', 'bookings', 'orders', 'order_items',
    'reviews', 'notifications', 'objects'
  )
ORDER BY table_schema, table_name, grantee, privilege_type;

SELECT ns.nspname AS schema_name,
       cls.relname AS table_name,
       cls.relrowsecurity AS rls_enabled,
       cls.relforcerowsecurity AS rls_forced
FROM pg_class cls
JOIN pg_namespace ns ON ns.oid = cls.relnamespace
WHERE ns.nspname IN ('public', 'storage')
  AND cls.relname IN (
    'profiles', 'addresses', 'cart', 'carts', 'cart_items',
    'partner_profiles', 'bookings', 'orders', 'order_items',
    'reviews', 'notifications', 'objects'
  )
ORDER BY ns.nspname, cls.relname;

SELECT target_role.rolname,
       target_role.rolsuper,
       target_role.rolbypassrls,
       parent_role.rolname AS member_of
FROM pg_roles target_role
LEFT JOIN pg_auth_members membership ON membership.member = target_role.oid
LEFT JOIN pg_roles parent_role ON parent_role.oid = membership.roleid
WHERE target_role.rolname IN ('anon', 'authenticated', 'service_role')
   OR parent_role.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY target_role.rolname, parent_role.rolname;
```

These views do not by themselves prove effective permissions through role
inheritance, ownership, `BYPASSRLS`, service credentials, or Supabase APIs.
Review role membership and table RLS flags as well; do not print or share
credential values.

**Function signatures, return types, security settings, and ACL metadata:**

```sql
SELECT p.oid::regprocedure AS signature,
       pg_get_function_identity_arguments(p.oid) AS identity_arguments,
       pg_get_function_result(p.oid) AS result,
       p.prosecdef AS security_definer,
       p.provolatile AS volatility,
       p.proconfig AS settings,
       pg_get_userbyid(p.proowner) AS owner,
       p.proacl AS acl,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_available_partner_bookings', 'get_partner_bookings',
    'update_partner_booking_status', 'create_order_from_cart',
    'create_booking', 'sau_current_role', 'sau_is_admin'
  )
ORDER BY p.proname, p.oid::regprocedure::text;
```

Inspect `pg_depend` and dependent views/routines before changing function
contracts. Inspect all ACL grantees, not only `PUBLIC` and `anon`.

**Trigger identities and definitions:**

```sql
SELECT ns.nspname AS schema_name,
       tbl.relname AS table_name,
       trg.tgname,
       trg.tgenabled,
       trg.tgtype,
       trg.tgattr,
       trg.tgqual,
       trg.tgargs,
       trg.tgconstraint,
       trg.tgfoid::regprocedure AS function_signature,
       pg_get_triggerdef(trg.oid, true) AS definition,
       pg_get_functiondef(trg.tgfoid) AS function_body
FROM pg_trigger trg
JOIN pg_class tbl ON tbl.oid = trg.tgrelid
JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
WHERE NOT trg.tgisinternal
  AND ((ns.nspname = 'public' AND tbl.relname IN ('bookings', 'orders', 'profiles'))
       OR (ns.nspname = 'auth' AND tbl.relname = 'users'))
ORDER BY ns.nspname, tbl.relname, trg.tgname;
```

Function bodies are code, not customer data; redact secrets if any unexpected
literal credentials are found.

**Schema shape and status constraint definitions:**

```sql
SELECT table_name, column_name, data_type, udt_name,
       is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'categories', 'services', 'products', 'addresses',
    'cart', 'carts', 'cart_items', 'partner_profiles',
    'bookings', 'orders', 'order_items', 'reviews', 'notifications'
  )
ORDER BY table_name, ordinal_position;

SELECT con.conrelid::regclass AS table_name,
       con.conname,
       con.convalidated,
       pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con
WHERE con.contype = 'c'
  AND con.conrelid IN (
    'public.bookings'::regclass,
    'public.orders'::regclass
  )
ORDER BY con.conrelid::regclass::text, con.conname;
```

Compare the column output to the migration's required-column list and review
all defaults, types, nullability, primary/unique constraints, and checks. The
second query should only be used after confirming both tables exist.

## RPC compatibility gate: `get_available_partner_bookings()`

**Status: BLOCKED until the deployed function is inspected.**

Repository evidence identifies this current application contract:

- **Arguments:** no arguments; the client calls
  `rpc('get_available_partner_bookings')`.
- **Expected result columns:** `id uuid`, `service_name text`,
  `service_slug text`, `category_slug text`, `booking_date date`,
  `booking_time text`, `total_amount numeric`, `status text`.
- **Authorization in proposed source:** authenticated caller must have a
  `profiles.role = 'partner'` row and an associated `partner_profiles` row;
  only `PENDING` bookings with no assigned partner are returned.
- **Callers:** `src/services/partnerService.ts` and partner registration UI.
  The UI uses `status` for available job rows; `get_partner_bookings()` supplies
  status transitions. The RPC does not select customer identity or contact
  details.
- **Repository dependency inventory:** `fetchAvailablePartnerBookings()` in
  `src/services/partnerService.ts` calls the RPC with no arguments, and
  `src/pages/PartnerRegistration.tsx` consumes those job records. The same
  service/UI flow also calls `get_partner_bookings()` and
  `update_partner_booking_status(p_booking_id, p_status)`; review them together
  when changing partner booking behavior. Searches of the current local
  `src/` and `supabase/` sources found no other application callers. The
  deployed application may differ from this checkout.
- **Database dependencies to inspect:** every overload, grants/ACLs,
  `SECURITY DEFINER` owner and `search_path`, function body, dependent views or
  routines, policies that call the function or expose related booking data,
  triggers and trigger functions that affect the returned booking state, and
  all deployed application versions that consume the current result contract.

Before replacement, compare `pg_get_function_identity_arguments`,
`pg_get_function_result`, `pg_get_functiondef`, ACLs, and `pg_depend` results
from the target. The current migration includes a return-type preflight, but
that has not been run and cannot establish deployed state. If the deployed
signature or result differs—or the dependencies are unknown—**do not apply**.
Perform a manual compatibility review and plan a versioned transition or
explicit dependency migration. PostgreSQL cannot always change a function's
return type through `CREATE OR REPLACE FUNCTION`.

## Checkout RPC compatibility gate: `create_order_from_cart`

**Local contract:** the updated frontend sends `p_address_id uuid` and a
deterministic `p_checkout_attempt_id uuid`; the RPC returns the existing
`orders.id` for a repeated key owned by the same authenticated customer. The
new nullable `orders.checkout_attempt_id` field has a unique index. The
one-argument overload now raises an explicit error and is revoked from
`authenticated` so stale clients cannot keep creating non-idempotent orders.

**Deployment is BLOCKED** until the target catalog and all deployed clients are
reviewed. Confirm existing overloads, exact parameter names/types, result type,
ACLs, owners/security settings, dependent objects, and any external caller of
the old one-argument RPC. The migration does not test whether the target
contains triggers, wrappers, or application versions that rely on that
function. A rollout must update supported clients to the two-argument
signature before relying on the new flow; old clients will fail closed.
Review existing `checkout_attempt_id` column/index definitions and duplicate
non-null values before accepting the migration's guard behavior. Existing
orders without an attempt ID remain unchanged.

## Disposable PostgreSQL test plan

**Availability: NOT VERIFIED / unavailable in this workspace.** This review
found no local `psql`, `postgres`, `initdb`, `pg_ctl`, `docker`, `podman`, or
`supabase` executable. No sanitized deployed schema/data snapshot was supplied
or found. The repository's reference schema is not a substitute.

When a safe environment is available:

1. Provision a fresh, disposable local PostgreSQL/Supabase-compatible instance
   with no project link, production secrets, or live network credentials.
   Ensure required Supabase roles, `auth` helpers, storage objects/functions,
   `pgcrypto`, and publication prerequisites exist, or use a dedicated local
   Supabase stack. Confirm its connection target before any test.
2. Prepare separate databases/fixtures from source schema and a reviewed,
   sanitized schema-only snapshot plus synthetic cart/profile/product rows.
   Keep real user/customer data out of fixtures. Retain a resettable baseline
   snapshot outside the migration transaction.
3. Run the migration only against that disposable instance and record
   PostgreSQL version, fixture version, output, and catalog diffs.
4. Run each negative test in a fresh database/transaction because a migration
   exception rolls back the transaction:
   - clean install and expected columns/FKs/indexes/policies/RPCs/triggers;
   - already-migrated schema rerun;
   - duplicate legacy cart IDs and duplicate owners;
   - missing owner profile and null/invalid owner;
   - same owner/different cart ID and same cart ID/different owner;
   - orphan cart IDs, orphan products, invalid quantities, duplicate items;
   - unexpected, duplicate, wrong-column, wrong-action, or unvalidated FKs;
   - wrong-name/same-name index, partial/wrong-column index, invalid index,
     and an already-correct equivalent unique index;
   - unsupported/null booking/order/payment statuses and unknown/multiple CHECKs;
   - unexpected policies, broad grants, function overloads, mismatched RPC return,
     duplicate/altered/disabled triggers, and altered trigger bodies;
   - deliberate partial-migration states followed by documented recovery and
     rerun. Distinguish clean idempotency from manual recovery.
5. Exercise RLS/functions under distinct customer, two partner, admin, anon,
   and service-role identities in the isolated instance. Verify one partner
   cannot accept/reject/update another partner's booking and two partners
   cannot both claim a pending booking.
6. Exercise simultaneous checkout calls with the same user/address/cart
   snapshot and confirm the same attempt ID yields exactly one pending order,
   one order-item snapshot, and one initial order notification. Verify that an
   attempt ID cannot return another customer's order, that the deprecated
   one-argument RPC fails closed, and that a rolled-back attempt can be retried.
   Also test changed cart/address inputs, reruns, and concurrent low-stock
   checkouts. The new RPC does not reserve/decrement inventory; distinct
   snapshots can still produce distinct pending orders.
7. Only after a trusted payment integration is implemented, test duplicate,
   delayed, reordered, invalid-signature, wrong-amount/currency, wrong-order,
   and replayed provider notifications, including concurrent deliveries and
   idempotent finalization. No such payment tests can pass against current code.

Do not point these tests at a linked or shared project. Do not use production
credentials. No PostgreSQL tests were run for this review.

## Payment-security gap report

- Checkout currently creates a `PENDING` order and snapshots cart items using
  current database prices. It leaves the cart and inventory unchanged.
- The UI explicitly says payment is not collected and processing is not
  configured. No trusted payment webhook/provider verification or finalization
  path was found in the local application/migration sources inspected.
- **Checkout idempotency is implemented in local source but unverified.**
  `orderService.ts` derives a stable UUID-shaped key from the customer, address
  ID, and sorted cart product/quantity snapshot. The two-argument RPC stores
  that key on `orders.checkout_attempt_id`; a unique index and
  `INSERT ... ON CONFLICT` path make a same-key retry return the existing order
  without duplicating its items or initial notification. The migration preserves
  existing orders by adding a nullable column; pre-existing duplicate non-null
  keys or an incompatible named index stop the migration for manual review.
  The legacy one-argument RPC fails closed and loses authenticated execution
  permission, so rollout must ensure supported clients call the new signature.
- A changed cart or address intentionally produces a different attempt key and
  can create a distinct pending order. The mechanism does not reserve stock or
  make distinct checkout snapshots mutually exclusive. It must be verified
  under concurrent transactions in an isolated PostgreSQL environment.
- Repository searches found no client path that updates `payment_status` or
  marks an order paid. The checkout RPC only inserts `PENDING`; the migration
  revokes authenticated order-table mutations and grants authenticated users
  read access. This is source-level evidence only and does not establish target
  database privileges or service-side behavior.
- Payment provider transaction/event identity, amount/currency binding,
  authenticity verification, and payment-finalization behavior remain
  unimplemented. No provider columns, credentials, event shapes, or success
  responses are assumed here.
- Do not mark an order paid, decrement stock, or clear cart rows based on a
  browser/client request. Keep payment status pending until a trusted
  server-side provider verification exists.
- Future payment integration requires a trusted server-side verification or
  webhook path; authentic notification verification; checks binding provider
  transaction to order, amount, and currency; unique provider transaction and
  event identities; and an atomic conditional transition that handles duplicate
  and out-of-order events without repeating side effects. Decide how to clear
  only the paid cart snapshot after verified payment, if that behavior is
  introduced.
- No payment schema or provider behavior is proposed here: none is established
  by the current repository contract.

## Current blockers and decision

1. No authorized live schema/data snapshot; existing-schema compatibility is
   unknown.
2. Deployed RPC signature, return type, dependencies, and ACLs are unknown. The
   migration's local guard does not replace preflight evidence.
3. SQL has not been parsed or run by PostgreSQL; trigger, policy, privilege, and
   migration-runtime behavior are unverified.
4. No disposable local PostgreSQL/Supabase environment or sanitized snapshot is
   available in this workspace.
5. Trusted payment confirmation is not implemented. Checkout idempotency has
   local code and schema changes but requires SQL/runtime and concurrency tests.

**Recommendation: DO NOT APPLY YET.** Revisit only after the read-only preflight
is complete, the deployed RPC contract is confirmed, SQL parsing and isolated
runtime tests pass, authorization is exercised under representative roles, and
payment remains explicitly pending until any future trusted integration has
been validated.
