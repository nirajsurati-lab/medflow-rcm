---
name: statements
description: "Adds manual patient statements and a public Stripe pay page; trigger phrases: patient statement, statement PDF, statement payment page, pay statement."
---

# Statements Skill

## New Tables With Columns

### `patient_statements`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `patient_id uuid not null references public.patients(id)`
- `claim_id uuid null references public.claims(id)`
- `statement_number text not null`
- `status text not null default 'draft'`
- `balance_due numeric(10,2) not null`
- `due_date date null`
- `statement_date date not null`
- `public_token text not null unique`
- `delivery_method text not null default 'manual'`
- `notes text null`
- `created_by uuid null references public.users(id)`
- `created_at timestamptz not null default timezone('utc', now())`
- `updated_at timestamptz not null default timezone('utc', now())`

### `statement_line_items`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `statement_id uuid not null references public.patient_statements(id) on delete cascade`
- `description text not null`
- `service_date date null`
- `amount numeric(10,2) not null`
- `created_at timestamptz not null default timezone('utc', now())`

## New Pages

- `/statements`
  Statement queue with draft, sent, viewed, and paid states.
- `/statements/new`
  Manual statement builder that selects patient and balance items.
- `/statements/[id]`
  Internal statement detail and resend/regenerate screen.
- `/pay/[statementId]`
  Public payment page that resolves by public token or statement id mapping.

## API Routes

- `GET /api/statements`
  List internal patient statements for the active org.
- `POST /api/statements`
  Create a draft statement with line items.
- `PATCH /api/statements/[id]`
  Update due date, status, notes, or line items.
- `POST /api/statements/[id]/send`
  Mark statement as sent for manual workflow.
- `GET /api/public/statements/[statementId]`
  Public read-only statement summary for payment page access.
- `POST /api/public/statements/[statementId]/payment-link`
  Create a Stripe checkout link scoped to the statement balance.

## Coding Rules Specific To This Feature

- Keep statement delivery manual. No email vendor integration unless explicitly requested.
- Use Stripe only for payment-link creation on the public statement page.
- Public payment pages must not expose internal org data beyond the targeted statement.
- All internal statement tables must use `org_id` and standard org RLS policies.
- Balance math must stay in `numeric(10,2)` columns and server-side validation.
- Prefer rendering statement summaries in app UI; PDF generation can remain deferred.

## What NOT To Touch In Existing Code

- Do not modify the existing patient payment link flow except to optionally reference statements later.
- Do not change auth requirements for internal pages.
- Do not add webhooks yet unless Phase 4 explicitly asks for them.
- Do not bypass org isolation or expose internal routes publicly.
