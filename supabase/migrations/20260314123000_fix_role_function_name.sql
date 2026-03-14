drop policy if exists organizations_update_admin on public.organizations;
drop policy if exists users_select_self_or_admin on public.users;
drop policy if exists users_update_self_or_admin on public.users;
drop policy if exists users_insert_admin on public.users;
drop policy if exists audit_logs_admin_select on public.audit_logs;

drop function if exists public.current_role();

create or replace function public.current_app_role()
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
  select public.current_app_role() in ('admin', 'biller')
$$;

create policy organizations_update_admin
on public.organizations
for update
to authenticated
using (id = public.current_org_id() and public.current_app_role() = 'admin')
with check (id = public.current_org_id() and public.current_app_role() = 'admin');

create policy users_select_self_or_admin
on public.users
for select
to authenticated
using (
  id = auth.uid()
  or (org_id = public.current_org_id() and public.current_app_role() = 'admin')
);

create policy users_update_self_or_admin
on public.users
for update
to authenticated
using (
  id = auth.uid()
  or (org_id = public.current_org_id() and public.current_app_role() = 'admin')
)
with check (
  id = auth.uid()
  or (org_id = public.current_org_id() and public.current_app_role() = 'admin')
);

create policy users_insert_admin
on public.users
for insert
to authenticated
with check (
  org_id = public.current_org_id()
  and public.current_app_role() = 'admin'
);

create policy audit_logs_admin_select
on public.audit_logs
for select
to authenticated
using (
  org_id = public.current_org_id()
  and public.current_app_role() = 'admin'
);
