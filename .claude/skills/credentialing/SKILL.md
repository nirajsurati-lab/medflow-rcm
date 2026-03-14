---
name: credentialing
description: "Adds payer-specific provider credentialing and 60-day expiry alerts; trigger phrases: credentialing, provider expiry, payer enrollment, credentialing alerts."
---

# Credentialing Skill

## New Tables With Columns

### `provider_credentials`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `provider_id uuid not null references public.providers(id)`
- `payer_id uuid not null references public.payers(id)`
- `status text not null default 'in_progress'`
- `effective_date date null`
- `expiry_date date null`
- `credential_number text null`
- `notes text null`
- `created_by uuid null references public.users(id)`
- `created_at timestamptz not null default timezone('utc', now())`
- `updated_at timestamptz not null default timezone('utc', now())`

### `credentialing_alerts`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `provider_credential_id uuid not null references public.provider_credentials(id) on delete cascade`
- `alert_type text not null`
- `trigger_date date not null`
- `resolved_at timestamptz null`
- `created_at timestamptz not null default timezone('utc', now())`

## New Pages

- `/credentialing`
  Provider-by-payer credentialing matrix with expiry states.
- `/credentialing/[id]`
  Credential detail view with notes and alert history.
- `/providers/[id]/credentialing`
  Provider-centric credentialing panel.

## API Routes

- `GET /api/credentialing`
  List provider credential records with payer labels and expiry state.
- `POST /api/credentialing`
  Create a manual payer enrollment record.
- `PATCH /api/credentialing/[id]`
  Update status, dates, number, and notes.
- `GET /api/credentialing/alerts`
  Return active expiry alerts due within 60 days.
- `POST /api/credentialing/run-alerts`
  Manual or scheduled alert generation pass.

## Coding Rules Specific To This Feature

- Credentialing is manual. Do not call CAQH, payer portals, or enrollment APIs.
- Generate alerts when `expiry_date` is within 60 days and unresolved.
- All moneyless records still require `org_id` and org-based RLS.
- Keep payer-specific credentialing separate from generic provider master data.
- Support multiple credentials per provider across different payers.
- Prefer server-side alert generation so dashboard widgets can reuse the same logic.

## What NOT To Touch In Existing Code

- Do not change provider CRUD assumptions in the claims workflow.
- Do not add notification vendors or email senders yet.
- Do not mix credentialing status into auth roles or login behavior.
- Do not break the current provider lookup structure used by claims.
