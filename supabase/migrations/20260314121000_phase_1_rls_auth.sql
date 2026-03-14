create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select case
    when coalesce(auth.jwt() ->> 'org_id', '') = '' then null
    else (auth.jwt() ->> 'org_id')::uuid
  end
$$;

create or replace function public.current_role()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'role', '')
$$;

create or replace function public.is_internal_user()
returns boolean
language sql
stable
as $$
  select public.current_role() in ('admin', 'biller')
$$;

create or replace function public.handle_auth_user_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_org_id uuid;
  metadata_role text;
begin
  metadata_org_id := nullif(new.raw_app_meta_data ->> 'org_id', '')::uuid;
  metadata_role := coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), 'biller');

  if metadata_org_id is null then
    return new;
  end if;

  insert into public.users (
    id,
    org_id,
    email,
    role,
    first_name,
    last_name
  )
  values (
    new.id,
    metadata_org_id,
    new.email,
    metadata_role,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (id) do update
  set
    org_id = excluded.org_id,
    email = excluded.email,
    role = excluded.role,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_synced on auth.users;
create trigger on_auth_user_synced
after insert or update of email, raw_app_meta_data, raw_user_meta_data
on auth.users
for each row
execute function public.handle_auth_user_sync();

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
begin
  select jsonb_build_object(
    'org_id', u.org_id,
    'role', u.role
  )
  into claims
  from public.users u
  where u.id = (event ->> 'user_id')::uuid;

  if claims is null then
    return event;
  end if;

  return jsonb_set(
    event,
    '{claims}',
    coalesce(event -> 'claims', '{}'::jsonb) || claims
  );
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant select on table public.users to supabase_auth_admin;
grant execute on function public.handle_auth_user_sync() to supabase_auth_admin;
revoke all on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.audit_logs enable row level security;

do $$
declare
  tenant_table text;
begin
  foreach tenant_table in array array[
    'patients',
    'providers',
    'payers',
    'fee_schedules',
    'insurance_plans',
    'claims',
    'procedures',
    'diagnoses',
    'payments',
    'adjustments',
    'denials',
    'appeals',
    'authorizations',
    'appointments',
    'statements'
  ]
  loop
    execute format('alter table public.%I enable row level security;', tenant_table);
    execute format(
      'create policy %I on public.%I for all to authenticated using (org_id = public.current_org_id() and public.is_internal_user()) with check (org_id = public.current_org_id() and public.is_internal_user());',
      tenant_table || '_internal_access',
      tenant_table
    );
  end loop;
end;
$$;

create policy organizations_select_current
on public.organizations
for select
to authenticated
using (id = public.current_org_id() and public.is_internal_user());

create policy organizations_update_admin
on public.organizations
for update
to authenticated
using (id = public.current_org_id() and public.current_role() = 'admin')
with check (id = public.current_org_id() and public.current_role() = 'admin');

create policy users_select_self_or_admin
on public.users
for select
to authenticated
using (
  id = auth.uid()
  or (org_id = public.current_org_id() and public.current_role() = 'admin')
);

create policy users_update_self_or_admin
on public.users
for update
to authenticated
using (
  id = auth.uid()
  or (org_id = public.current_org_id() and public.current_role() = 'admin')
)
with check (
  id = auth.uid()
  or (org_id = public.current_org_id() and public.current_role() = 'admin')
);

create policy users_insert_admin
on public.users
for insert
to authenticated
with check (
  org_id = public.current_org_id()
  and public.current_role() = 'admin'
);

create policy users_select_for_auth_hook
on public.users
for select
to supabase_auth_admin
using (true);

create policy audit_logs_admin_select
on public.audit_logs
for select
to authenticated
using (
  org_id = public.current_org_id()
  and public.current_role() = 'admin'
);

create or replace function public.log_audit_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
  target_record_id uuid;
begin
  target_org_id := coalesce(new.org_id, old.org_id);
  target_record_id := coalesce(new.id, old.id);

  insert into public.audit_logs (
    org_id,
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  )
  values (
    target_org_id,
    auth.uid(),
    tg_op,
    tg_table_name,
    target_record_id,
    to_jsonb(old),
    to_jsonb(new)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

do $$
declare
  audited_table text;
begin
  foreach audited_table in array array[
    'claims',
    'patients',
    'payments',
    'denials',
    'statements',
    'users'
  ]
  loop
    execute format(
      'create trigger audit_%1$s after insert or update or delete on public.%1$s for each row execute function public.log_audit_changes();',
      audited_table
    );
  end loop;
end;
$$;
