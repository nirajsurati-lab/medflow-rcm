# Supabase Setup

Apply the migrations in `supabase/migrations/` in filename order.

## After Running the Migrations

1. In Supabase Dashboard, open `Authentication -> Auth Hooks`.
2. Open `Custom Access Token` and configure it to call `public.custom_access_token_hook`.
3. Create an organization row in `public.organizations`.
4. Create auth users with `app_metadata.org_id` and `app_metadata.role`.
5. The `auth.users` trigger will upsert the matching `public.users` row automatically.
6. If you want to use the in-app `/signup` page, add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.

## Example App Metadata

```json
{
  "org_id": "YOUR_ORG_UUID",
  "role": "admin"
}
```

Optional `user_metadata`:

```json
{
  "first_name": "Ava",
  "last_name": "Biller"
}
```
