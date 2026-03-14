---
name: collections
description: "Adds overdue claim collections workflow, aging automation, and dunning notes; trigger phrases: collections, overdue claims, aging job, dunning notes."
---

# Collections Skill

## New Tables With Columns

### `collection_worklists`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `claim_id uuid not null references public.claims(id)`
- `status text not null default 'open'`
- `assigned_to uuid null references public.users(id)`
- `priority text not null default 'medium'`
- `days_outstanding integer not null default 0`
- `next_action_date date null`
- `created_at timestamptz not null default timezone('utc', now())`
- `updated_at timestamptz not null default timezone('utc', now())`

### `collection_notes`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `collection_worklist_id uuid not null references public.collection_worklists(id) on delete cascade`
- `note_type text not null default 'dunning'`
- `content text not null`
- `created_by uuid null references public.users(id)`
- `created_at timestamptz not null default timezone('utc', now())`

### `collection_runs`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `run_date date not null`
- `claims_flagged integer not null default 0`
- `created_at timestamptz not null default timezone('utc', now())`

## New Pages

- `/collections`
  Aging and collections worklist with open claims by bucket.
- `/collections/[id]`
  Worklist detail page with dunning notes and next action date.
- `/reports/aging`
  Aging report view focused on collection follow-up.

## API Routes

- `GET /api/collections`
  List open collection work items with aging metrics.
- `POST /api/collections/run-aging`
  Manual backfill or rerun of the aging logic.
- `PATCH /api/collections/[id]`
  Update priority, assignment, or next action date.
- `GET /api/collections/[id]/notes`
  List dunning notes for a work item.
- `POST /api/collections/[id]/notes`
  Add a manual collection note.

## Coding Rules Specific To This Feature

- Implement aging logic in Postgres or server code, then schedule it with `pg_cron` once daily.
- Do not call external collection agencies or messaging APIs.
- Use deterministic aging buckets based on claim creation date or latest unpaid activity date.
- Every new table must include `org_id` and standard org-scoped RLS.
- Notes are manual operational records and must be auditable.
- Keep aging jobs idempotent so repeated runs do not duplicate worklist entries.

## What NOT To Touch In Existing Code

- Do not alter the core claims creation schema beyond reading claim state for aging.
- Do not replace the upcoming dashboard A/R visuals; collections is a separate workflow.
- Do not add background workers outside Supabase SQL functions and `pg_cron`.
- Do not introduce external notifications unless explicitly requested later.
