---
name: appointments
description: "Adds scheduling and auto-draft claim creation after appointment completion; trigger phrases: appointments, schedule patient, completed visit, auto draft claim."
---

# Appointments Skill

## New Tables With Columns

### `appointment_types`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `name text not null`
- `default_duration_minutes integer not null`
- `default_cpt_code text null`
- `active boolean not null default true`
- `created_at timestamptz not null default timezone('utc', now())`
- `updated_at timestamptz not null default timezone('utc', now())`

### `appointment_status_history`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `appointment_id uuid not null references public.appointments(id) on delete cascade`
- `status text not null`
- `changed_by uuid null references public.users(id)`
- `created_at timestamptz not null default timezone('utc', now())`

### `appointment_claim_links`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `appointment_id uuid not null references public.appointments(id) on delete cascade`
- `claim_id uuid not null references public.claims(id) on delete cascade`
- `created_at timestamptz not null default timezone('utc', now())`

## New Pages

- `/appointments`
  Calendar/list hybrid with daily schedule and completion state.
- `/appointments/new`
  Manual appointment booking page.
- `/appointments/[id]`
  Appointment detail with status history and claim link.

## API Routes

- `GET /api/appointments`
  List appointments by day, provider, or location.
- `POST /api/appointments`
  Create a new appointment.
- `PATCH /api/appointments/[id]`
  Update appointment details or status.
- `POST /api/appointments/[id]/complete`
  Mark appointment completed and auto-create a draft claim.
- `GET /api/appointments/[id]/claim`
  Return the linked draft claim if one exists.

## Coding Rules Specific To This Feature

- Use the existing `appointments` table as the primary scheduling record and extend around it only where needed.
- Completion should create a draft claim, never auto-submit it.
- Auto-created claims must still respect manual validation and later authorization/contract rules.
- All new appointment-support tables must include `org_id` and standard RLS.
- Keep scheduling manual with no calendar sync or SMS integrations.
- Require explicit provider, patient, payer, and service details before claim draft creation.

## What NOT To Touch In Existing Code

- Do not replace the current manual claim creation flow; appointment completion should add an alternate entry point.
- Do not introduce external scheduling providers.
- Do not remove or rename the existing `appointments` table from the base schema.
- Do not couple appointment completion directly to Stripe or denial logic.
