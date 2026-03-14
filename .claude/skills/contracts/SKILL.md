---
name: contracts
description: "Adds payer fee schedules and reimbursement lookup during claim drafting; trigger phrases: payer contract, fee schedule, reimbursement lookup, contract rates."
---

# Contracts Skill

## New Tables With Columns

### `payer_contracts`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `payer_id uuid not null references public.payers(id)`
- `name text not null`
- `status text not null default 'active'`
- `effective_date date not null`
- `end_date date null`
- `notes text null`
- `created_at timestamptz not null default timezone('utc', now())`
- `updated_at timestamptz not null default timezone('utc', now())`

### `payer_contract_rates`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `payer_contract_id uuid not null references public.payer_contracts(id) on delete cascade`
- `cpt_code text not null`
- `modifier text null`
- `allowed_amount numeric(10,2) not null`
- `effective_date date not null`
- `end_date date null`
- `created_at timestamptz not null default timezone('utc', now())`
- `updated_at timestamptz not null default timezone('utc', now())`

## New Pages

- `/contracts`
  Payer contract list with active and expired agreements.
- `/contracts/[id]`
  Contract detail view with CPT reimbursement rates.
- `/contracts/[id]/rates`
  Bulk/manual rate maintenance page.

## API Routes

- `GET /api/contracts`
  List org-scoped payer contracts.
- `POST /api/contracts`
  Create a payer contract shell.
- `PATCH /api/contracts/[id]`
  Update contract status, dates, and notes.
- `GET /api/contracts/[id]/rates`
  List CPT reimbursement rows.
- `POST /api/contracts/[id]/rates`
  Add or replace manual CPT rate rows.
- `GET /api/claims/reimbursement-preview`
  Return allowed amount lookup for selected payer and CPT codes during claim draft.

## Coding Rules Specific To This Feature

- Keep reimbursement lookup fully internal from local fee schedule data. No payer APIs.
- Use `numeric(10,2)` for every contractual amount.
- Contract lookup should populate or suggest `allowed_amount` during claim creation without auto-submitting anything.
- Respect org isolation with `org_id` RLS on all new contract tables.
- Resolve active rate by payer, CPT code, and effective date at claim draft time.
- Preserve manual override ability in the claim form even when a contract rate exists.

## What NOT To Touch In Existing Code

- Do not remove current manual `allowed_amount` entry in claim procedures.
- Do not modify Stripe, denials, or patient CRUD flows.
- Do not merge contract logic into payer master data beyond foreign keys and read-only labels.
- Do not add external data importers unless explicitly approved later.
