# Vercel Deployment Guide

## Before You Deploy

Make sure your Supabase project is already set up:

1. Run both SQL migrations from `supabase/migrations/` in order.
2. Configure the `public.custom_access_token_hook` in Supabase Auth Hooks.
3. Create at least one organization row.
4. Create at least one admin user with `app_metadata.org_id` and `app_metadata.role`.

## Required Environment Variables

Add these in Vercel under `Project Settings -> Environment Variables`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The app currently uses a dummy internal payment flow, so no gateway keys are required.

## Recommended Vercel Project Settings

- Framework Preset: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leave empty and use the default Next.js output
- Node version: use the Vercel default current LTS-compatible version

## Deploy Steps

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Import the repo into Vercel.
3. Add the three Supabase environment variables.
4. Trigger the first deployment.
5. Open the deployed URL and sign in with your Supabase admin or biller account.

## Post-Deploy Smoke Check

After deployment, verify:

1. `/login` loads and accepts your Supabase credentials.
2. `/` loads the dashboard tab.
3. You can create a patient.
4. You can create and submit a claim.
5. You can generate a demo payment link and simulate success.
6. As an admin, you can open the `Audit` tab and see change history.

## Notes

- The app depends on Supabase RLS, so if deployed pages load but data is missing, check the user metadata and JWT hook first.
- Audit logs are written by database triggers, so Supabase migrations must be applied before production testing.
