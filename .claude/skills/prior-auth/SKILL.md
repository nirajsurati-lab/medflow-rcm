---
name: prior-auth
description: "Adds manual prior authorization tracking and claim submit blocking; trigger phrases: prior auth, prior authorization, auth expired, block claim submission."
---

# Prior Authorization Skill

## New Tables With Columns

### `prior_authorizations`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `patient_id uuid not null references public.patients(id)`
- `payer_id uuid not null references public.payers(id)`
- `provider_id uuid not null references public.providers(id)`
- `authorization_number text not null`
- `status text not null default 'pending'`
- `service_start date not null`
- `service_end date not null`
- `approved_units integer null`
- `approved_amount numeric(10,2) null`
- `notes text null`
- `created_by uuid null references public.users(id)`
- `created_at timestamptz not null default timezone('utc', now())`
- `updated_at timestamptz not null default timezone('utc', now())`

### `claim_authorizations`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `claim_id uuid not null references public.claims(id) on delete cascade`
- `prior_authorization_id uuid not null references public.prior_authorizations(id) on delete cascade`
- `created_at timestamptz not null default timezone('utc', now())`

## New Pages

- `/authorizations`
  Manual list and filter view for prior auth records.
- `/authorizations/new`
  Form to create and attach a prior auth to a patient, provider, and payer.
- `/claims/[id]/authorization`
  Claim-side view to link or review the required prior auth before submission.

## API Routes

- `GET /api/prior-authorizations`
  List org-scoped prior auth records with patient, payer, and provider labels.
- `POST /api/prior-authorizations`
  Create a manual prior auth record.
- `PATCH /api/prior-authorizations/[id]`
  Update status, service dates, approval values, and notes.
- `POST /api/claims/[id]/authorization`
  Link an existing prior auth to a claim.
- `POST /api/claims/[id]/validate-authorization`
  Check whether the claim has a valid, non-expired auth before submission.

## Coding Rules Specific To This Feature

- Keep the workflow fully manual. Do not call payer authorization APIs.
- All new tables must include `org_id` and use the same RLS policy pattern as `public.claims`.
- Block claim submission only when payer or claim rules mark authorization as required.
- Treat expired auths as invalid when `service_end < current_date`.
- Store approved money values as `numeric(10,2)` only.
- Add validation in the claim submission path before changing claim status to `submitted`.

## What NOT To Touch In Existing Code

- Do not change Supabase auth, login, middleware, or Phase 1 schema patterns.
- Do not rewrite the current patient CRUD or claims drafting UI from scratch.
- Do not add external API integrations, AI flows, or clearinghouse logic.
- Do not remove the existing manual claim submit route; extend it with authorization checks only.
