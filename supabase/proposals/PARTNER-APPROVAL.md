# Partner approval and suspension proposal

**Status:** Proposal only; not applied to any Supabase project.

## Why this is needed

The current model uses `partner_profiles` as the submitted partner profile, but it has no application/approval status or review metadata. The customer-facing registration code upserts that profile. The partner booking RPCs currently treat any `profiles.role = 'partner'` user with a `partner_profiles` row as eligible to list open bookings and update booking statuses. Consequently, there is no database-backed distinction between an applicant and an approved partner.

The dashboard implementation intentionally does not offer partner approval, suspension, or booking mutations until this boundary exists.

## Proposed schema change

Add a constrained status to `partner_profiles`, defaulting new rows to `PENDING`:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `SUSPENDED`

Add nullable review metadata: `reviewed_at`, `reviewed_by` (referencing the administrator profile), and `review_reason`. Preserve existing partner rows and assign their initial state explicitly during migration review; do not silently treat existing rows as approved.

Partner self-service writes must not set or modify the approval status or review metadata. Enforce this on the trusted database path, not with disabled form controls or client checks. Admin review operations should use a narrowly scoped database function that checks `public.sau_is_admin()`, validates allowed status transitions, records the acting administrator and reason, and refuses invalid transitions.

## Required policy and RPC updates

In the same reviewed migration:

1. Update `get_partner_bookings()`, `get_available_partner_bookings()`, and `update_partner_booking_status(...)` to require a matching `APPROVED` partner profile.
2. Keep applicants able to read and edit only their own submitted profile fields. They must not see unassigned jobs or mutate bookings while pending, rejected, or suspended.
3. Keep administrator reads and review writes protected by the existing `sau_is_admin()` helper and RLS.
4. Record review decisions in an audit table or equivalent append-only record, with access restricted to administrators. Do not expose a public admin-registration path.
5. Preserve booking status transition validation in trusted SQL functions; do not let the dashboard update booking rows directly.

Before deciding whether audit records need a new table, inspect any deployed audit mechanism and existing constraints. Do not create a duplicate if one already exists.

## Proposed audit record shape

If inspection confirms there is no existing audit facility, add an administrator-only, append-only table with:

- A generated primary key and server-generated `created_at`.
- `actor_user_id` referencing the administrator profile.
- `action` and `target_type` constrained to known values.
- `target_id` for the reviewed partner profile or affected record.
- `reason` for rejection/suspension and other decisions that require an explanation.
- `before_state` and `after_state` JSONB snapshots limited to the fields needed to explain the decision; never copy credentials or unrelated customer PII.

Only the trusted review/status RPC should insert audit rows. Do not grant authenticated clients `UPDATE` or `DELETE` on the table. Administrator read access should use `sau_is_admin()` plus restrictive RLS, and non-administrators should have no access.

## Review and rollout checks

- Inspect the deployed `partner_profiles` columns, policies, grants, and all dependents before writing `ALTER TABLE` statements.
- Check how many existing partner rows exist and agree on their initial status with the business owner.
- Confirm only trusted administrators can approve, reject, suspend, and reactivate.
- Confirm partner self-updates cannot change review fields, including through direct PostgREST requests.
- Confirm pending/rejected/suspended users cannot call either job-listing RPC or the booking-status RPC.
- Confirm approved partners can follow only the existing valid booking status transitions.
- Run the migration against a non-production Supabase project with customer, applicant, approved partner, suspended partner, and administrator test accounts.
- Apply to production manually only after review, backup, and explicit approval.
