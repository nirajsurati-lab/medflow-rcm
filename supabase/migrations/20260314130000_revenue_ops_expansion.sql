create extension if not exists pg_cron with schema extensions;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (org_id, name)
);

alter table public.locations enable row level security;

create policy if not exists locations_internal_access
on public.locations
for all
to authenticated
using (org_id = public.current_org_id() and public.is_internal_user())
with check (org_id = public.current_org_id() and public.is_internal_user());

create trigger set_locations_updated_at
before update on public.locations
for each row
execute function public.set_updated_at();

insert into public.locations (org_id, name, is_default)
select organizations.id, 'Main location', true
from public.organizations
where not exists (
  select 1
  from public.locations
  where locations.org_id = organizations.id
);

alter table public.patients add column if not exists location_id uuid references public.locations(id) on delete set null;
alter table public.providers add column if not exists location_id uuid references public.locations(id) on delete set null;
alter table public.claims add column if not exists location_id uuid references public.locations(id) on delete set null;
alter table public.payments add column if not exists location_id uuid references public.locations(id) on delete set null;
alter table public.authorizations add column if not exists location_id uuid references public.locations(id) on delete set null;
alter table public.appointments add column if not exists location_id uuid references public.locations(id) on delete set null;
alter table public.statements add column if not exists location_id uuid references public.locations(id) on delete set null;

update public.patients
set location_id = locations.id
from public.locations
where patients.org_id = locations.org_id
  and locations.is_default = true
  and patients.location_id is null;

update public.providers
set location_id = locations.id
from public.locations
where providers.org_id = locations.org_id
  and locations.is_default = true
  and providers.location_id is null;

update public.claims
set location_id = locations.id
from public.locations
where claims.org_id = locations.org_id
  and locations.is_default = true
  and claims.location_id is null;

update public.payments
set location_id = locations.id
from public.locations
where payments.org_id = locations.org_id
  and locations.is_default = true
  and payments.location_id is null;

update public.authorizations
set location_id = locations.id
from public.locations
where authorizations.org_id = locations.org_id
  and locations.is_default = true
  and authorizations.location_id is null;

update public.appointments
set location_id = locations.id
from public.locations
where appointments.org_id = locations.org_id
  and locations.is_default = true
  and appointments.location_id is null;

update public.statements
set location_id = locations.id
from public.locations
where statements.org_id = locations.org_id
  and locations.is_default = true
  and statements.location_id is null;

alter table public.authorizations add column if not exists notes text;

alter table public.claims
  add column if not exists collections_status text not null default 'none'
    check (collections_status in ('none', 'overdue', 'sent')),
  add column if not exists collections_sent_at timestamptz,
  add column if not exists dunning_notes text,
  add column if not exists appointment_id uuid references public.appointments(id) on delete set null;

alter table public.appointments
  add column if not exists type text not null default 'office_visit',
  add column if not exists payer_id uuid references public.payers(id) on delete set null,
  add column if not exists claim_id uuid references public.claims(id) on delete set null;

alter table public.statements
  add column if not exists claim_id uuid references public.claims(id) on delete set null,
  add column if not exists status text not null default 'open'
    check (status in ('open', 'sent', 'paid', 'voided')),
  add column if not exists public_token text,
  add column if not exists token_expires_at timestamptz,
  add column if not exists stripe_checkout_url text,
  add column if not exists last_sent_at timestamptz;

create unique index if not exists statements_public_token_idx
  on public.statements (public_token)
  where public_token is not null;

create index if not exists authorizations_patient_payer_idx
  on public.authorizations (org_id, patient_id, payer_id, status);

create index if not exists claims_collections_idx
  on public.claims (org_id, collections_status, submitted_at);

create index if not exists appointments_billing_idx
  on public.appointments (org_id, billing_status, status, scheduled_at);

create table if not exists public.statement_line_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  statement_id uuid not null references public.statements(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete set null,
  kind text not null check (kind in ('charge', 'insurance_adjustment', 'patient_responsibility', 'payment')),
  label text not null,
  amount numeric(10,2) not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.statement_line_items enable row level security;

create policy if not exists statement_line_items_internal_access
on public.statement_line_items
for all
to authenticated
using (org_id = public.current_org_id() and public.is_internal_user())
with check (org_id = public.current_org_id() and public.is_internal_user());

create trigger set_statement_line_items_updated_at
before update on public.statement_line_items
for each row
execute function public.set_updated_at();

create index if not exists statement_line_items_statement_idx
  on public.statement_line_items (org_id, statement_id);

create table if not exists public.credentialing (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  provider_id uuid not null references public.providers(id) on delete cascade,
  payer_id uuid not null references public.payers(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'submitted', 'approved', 'expired', 'denied')),
  submitted_at timestamptz,
  approved_at timestamptz,
  expiry_date date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (org_id, provider_id, payer_id)
);

alter table public.credentialing enable row level security;

create policy if not exists credentialing_internal_access
on public.credentialing
for all
to authenticated
using (org_id = public.current_org_id() and public.is_internal_user())
with check (org_id = public.current_org_id() and public.is_internal_user());

create trigger set_credentialing_updated_at
before update on public.credentialing
for each row
execute function public.set_updated_at();

create index if not exists credentialing_org_id_idx
  on public.credentialing (org_id);

create or replace function public.process_overdue_collections()
returns integer
language plpgsql
as $$
declare
  touched_count integer;
begin
  update public.claims
  set collections_status = 'overdue'
  where status <> 'paid'
    and submitted_at is not null
    and submitted_at <= timezone('utc', now()) - interval '90 days'
    and collections_status = 'none';

  get diagnostics touched_count = row_count;
  return touched_count;
end;
$$;

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'medflow_process_overdue_collections'
  ) then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'medflow_process_overdue_collections';
  end if;

  perform cron.schedule(
    'medflow_process_overdue_collections',
    '0 2 * * *',
    $$select public.process_overdue_collections();$$
  );
exception
  when undefined_table then
    null;
end;
$$;
