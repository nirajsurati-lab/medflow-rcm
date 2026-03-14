---
name: multi-location
description: "Adds org locations, sidebar switching, and location-aware data isolation; trigger phrases: multi location, practice locations, switch location, location scope."
---

# Multi-Location Skill

## New Tables With Columns

### `locations`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `name text not null`
- `code text not null`
- `address jsonb null`
- `phone text null`
- `is_active boolean not null default true`
- `created_at timestamptz not null default timezone('utc', now())`
- `updated_at timestamptz not null default timezone('utc', now())`

### `user_locations`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `user_id uuid not null references public.users(id) on delete cascade`
- `location_id uuid not null references public.locations(id) on delete cascade`
- `is_default boolean not null default false`
- `created_at timestamptz not null default timezone('utc', now())`

### `provider_locations`
- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `provider_id uuid not null references public.providers(id) on delete cascade`
- `location_id uuid not null references public.locations(id) on delete cascade`
- `created_at timestamptz not null default timezone('utc', now())`

## New Pages

- `/locations`
  Location management page for admins.
- `/settings/locations`
  Assignment page for users and providers.

## API Routes

- `GET /api/locations`
  List org locations available to the current user.
- `POST /api/locations`
  Create a new practice location.
- `PATCH /api/locations/[id]`
  Update location profile fields.
- `POST /api/users/location-context`
  Save the current location switcher choice in session or profile metadata.
- `GET /api/location-scoped/summary`
  Return dashboard summary filtered by location.

## Coding Rules Specific To This Feature

- Add `location_id` to location-sensitive tables such as claims, patients, appointments, payments, and denials when the feature is implemented.
- Keep `org_id` as the top-level tenant boundary and layer `location_id` underneath it.
- RLS must always enforce `org_id`, and for location-aware tables also enforce allowed `location_id` access.
- The sidebar switcher should filter context, not create a separate auth tenant.
- Default to manual location assignment with no geolocation or third-party sync.
- Preserve cross-location admin visibility only when explicitly allowed by user-location mapping.

## What NOT To Touch In Existing Code

- Do not replace the current org-based RLS model; extend it carefully with `location_id`.
- Do not hardcode location filters into auth helpers before schema support exists.
- Do not rebuild the whole navigation shell just to add the switcher.
- Do not scope global configuration tables that should remain org-wide only.
