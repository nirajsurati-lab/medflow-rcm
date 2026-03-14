create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  npi text,
  tax_id text,
  address jsonb,
  plan_tier text not null default 'starter',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null unique,
  role text not null default 'biller' check (role in ('admin', 'biller', 'patient')),
  first_name text,
  last_name text,
  last_login timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  dob date not null,
  insurance_id text,
  address jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  npi text not null,
  first_name text not null,
  last_name text not null,
  specialty text,
  credentials_status text not null default 'pending'
    check (credentials_status in ('pending', 'active', 'expired', 'suspended')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (org_id, npi)
);

create table public.payers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  payer_id text not null,
  clearinghouse text,
  api_endpoint text,
  contact_info jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (org_id, payer_id)
);

create table public.fee_schedules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  payer_id uuid not null references public.payers(id) on delete cascade,
  cpt_code text not null,
  allowed_amount numeric(10,2) not null default 0.00 check (allowed_amount >= 0),
  effective_date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (org_id, payer_id, cpt_code, effective_date)
);

create table public.insurance_plans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  payer_name text not null,
  payer_id uuid not null references public.payers(id) on delete cascade,
  plan_type text not null,
  contact_info jsonb,
  fee_schedule_id uuid references public.fee_schedules(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.authorizations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  payer_id uuid not null references public.payers(id) on delete cascade,
  procedure_codes text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied', 'expired')),
  valid_from date,
  valid_to date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'checked_in', 'completed', 'cancelled', 'no_show')),
  billing_status text not null default 'pending'
    check (billing_status in ('pending', 'ready', 'claimed', 'paid')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  payer_id uuid not null references public.payers(id) on delete cascade,
  status text not null default 'draft'
    check (
      status in (
        'draft',
        'validated',
        'submitted',
        'accepted',
        'rejected',
        'paid',
        'denied',
        'appealed'
      )
    ),
  total_amount numeric(10,2) not null default 0.00,
  submitted_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.procedures (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  cpt_code text not null,
  description text,
  units integer not null default 1 check (units > 0),
  charge_amount numeric(10,2) not null default 0.00 check (charge_amount >= 0),
  allowed_amount numeric(10,2) not null default 0.00 check (allowed_amount >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  icd10_code text not null,
  description text,
  sequence integer not null default 1 check (sequence > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete set null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  method text not null default 'card'
    check (method in ('card', 'ach', 'cash', 'check', 'other')),
  stripe_id text,
  received_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'refunded', 'voided')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.adjustments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  type text not null
    check (type in ('contractual', 'write_off', 'patient_responsibility', 'other')),
  amount numeric(10,2) not null check (amount >= 0),
  reason_code text,
  applied_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.denials (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  reason_code text not null,
  reason_desc text not null,
  appeal_deadline date,
  status text not null default 'open'
    check (status in ('open', 'appealed', 'resolved', 'closed')),
  resubmitted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  denial_id uuid not null references public.denials(id) on delete cascade,
  submitted_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'accepted', 'rejected')),
  resolution text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.statements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  amount_due numeric(10,2) not null default 0.00 check (amount_due >= 0),
  due_date date not null,
  sent_at timestamptz,
  paid_at timestamptz,
  delivery_method text not null default 'email'
    check (delivery_method in ('email', 'sms', 'mail', 'portal')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  table_name text not null,
  record_id uuid not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index patients_org_id_idx on public.patients (org_id);
create index providers_org_id_idx on public.providers (org_id);
create index payers_org_id_idx on public.payers (org_id);
create index fee_schedules_org_id_idx on public.fee_schedules (org_id);
create index insurance_plans_org_id_idx on public.insurance_plans (org_id);
create index authorizations_org_id_idx on public.authorizations (org_id);
create index appointments_org_id_idx on public.appointments (org_id);
create index claims_org_id_idx on public.claims (org_id);
create index claims_status_idx on public.claims (status);
create index procedures_org_id_idx on public.procedures (org_id);
create index diagnoses_org_id_idx on public.diagnoses (org_id);
create index payments_org_id_idx on public.payments (org_id);
create index denials_org_id_idx on public.denials (org_id);
create index statements_org_id_idx on public.statements (org_id);
create index audit_logs_org_id_idx on public.audit_logs (org_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations',
    'users',
    'patients',
    'providers',
    'payers',
    'fee_schedules',
    'insurance_plans',
    'authorizations',
    'appointments',
    'claims',
    'procedures',
    'diagnoses',
    'payments',
    'adjustments',
    'denials',
    'appeals',
    'statements'
  ]
  loop
    execute format(
      'create trigger set_%1$s_updated_at before update on public.%1$s for each row execute function public.set_updated_at();',
      table_name
    );
  end loop;
end;
$$;
