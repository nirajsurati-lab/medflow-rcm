# MedFlow Pro

MedFlow Pro is a manual-entry medical billing MVP built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase, and a dummy payment-link flow for demos.

## Phase 1 Status

Phase 1 sets up:

- Next.js 15 App Router project scaffold
- shadcn/ui component foundation
- Full Supabase schema migrations with RLS and auth hook support
- Supabase Auth login flow and protected app shell

## Getting Started

1. Copy `.env.example` to `.env.local`.
2. Fill in your Supabase project URL and anon key.
3. Apply the SQL files in `supabase/migrations/` in timestamp order.
4. In the Supabase dashboard under `Authentication -> Auth Hooks`, set the `Custom Access Token` hook to `public.custom_access_token_hook`.
5. Create an organization row, then create auth users with `org_id` and `role` in app metadata.
6. Start the app with `npm run dev`.

## Payments

Phase 2 uses an internal demo payment page so the project can be shown without any gateway onboarding or verification.

## Deployment And Testing Guides

- Deployment: `docs/vercel-deployment-guide.md`
- App walkthrough and test flow: `docs/application-test-guide.md`

## Scripts

- `npm run dev` starts the local Next.js server.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs the TypeScript checker.
- `npm run build` creates a production build.

## Auth Provisioning Notes

This MVP uses internal staff roles for now:

- `admin`
- `biller`

Each auth user also needs a matching `public.users` row with an `org_id`. The migration includes an `auth.users` trigger that can create that profile automatically when the auth user is created with app metadata like:

```json
{
  "org_id": "YOUR_ORG_UUID",
  "role": "admin"
}
```

`first_name` and `last_name` can be passed in `user_metadata`.
