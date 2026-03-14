# RLS Access Review

This document captures the remaining places where MedFlow Pro still uses the Supabase service role and why.

## Current compatibility mode

The app is currently running in a temporary compatibility mode because the live
Supabase RLS helpers are still throwing database errors such as
`role "admin" does not exist` during normal session-client reads.

These paths prefer the service-role client when it is available, while still
applying explicit `org_id = profile.org_id` filters in the service layer:

- `app/page.tsx` loads workspace data with `createAdminSupabaseClient() ?? createServerSupabaseClient()`
- `lib/services/workspace.ts` hydrates patients, providers, payers, claims, payments, denials, and audit logs from the client passed in by the caller
- `lib/auth/context.ts` returns `createAdminSupabaseClient() ?? createServerSupabaseClient()` for feature API handlers

Every feature service still applies explicit `org_id = profile.org_id` filters on reads, updates, and deletes. That keeps tenant scoping visible in code even when RLS is also enforcing it.

## Remaining admin fallbacks

### `lib/auth/signup-service.ts`

Why it still uses admin:

- creating organizations for first-time signup
- creating Supabase Auth users through `auth.admin.createUser`
- backfilling the matching `public.users` staff profile

This should stay on the service role permanently. It is a bootstrap capability, not normal user traffic.

### `lib/auth/session.ts`

Why it still uses admin fallback:

- recovering the current `public.users` profile when the session client cannot see it
- recovering the current `organizations` row when the session client cannot read it

This only affects initial page hydration and auth/session context lookup.

What must be true before removal:

- `public.users` is readable for the signed-in user through the session client
- `public.organizations` is readable for the signed-in user through the session client
- JWT `org_id` and `role` claims are present and stable after login/signup
- the current RLS helper functions and policies are verified in the Supabase project

### `lib/auth/context.ts`

Why it still uses admin fallback:

- recovering the caller's `public.users` profile inside API auth guards when the session client cannot read it
- keeping feature APIs functional while the live RLS helper path is unstable

What must be true before removal:

- authenticated requests can always read the caller's own `public.users` row through RLS
- same-org feature reads and writes succeed with the session client alone
- that behavior is verified for both `admin` and `biller` roles

## Target end state

Once the live database policies are repaired, this should return to:

- `app/page.tsx` using the session client for workspace hydration
- `lib/auth/context.ts` using the session client for feature APIs
- admin fallback limited to signup/bootstrap and profile/org recovery only

## Follow-up cleanup

The next security-focused pass should validate the live Supabase policies and helper functions against this matrix:

- login with `admin` and verify `public.users` read via session client
- login with `biller` and verify same-org patient/claim/payment reads via session client
- confirm cross-org access fails for all feature routes
- confirm audit log access remains admin-only
