# Application Test Guide

This guide walks through the whole MedFlow Pro MVP so you can test it quickly.

## 1. Login

Page:

- `/login`

What to do:

1. Sign in using the Supabase user you created earlier.
2. Confirm you land on the main workspace.

Expected result:

- The app opens on the `Dashboard` tab.
- You should see KPI cards, the A/R aging chart, and the claims queue.

## 2. Dashboard

Tab:

- `Dashboard`

What to check:

1. KPI cards render without errors.
2. The A/R aging chart renders.
3. The claims queue table shows unpaid claims if data exists.

Expected result:

- Empty states should render cleanly if you have not entered much data yet.

## 3. Patients

Tab:

- `Patients`

What to do:

1. Create a patient with first name, last name, and DOB.
2. Optionally add insurance ID and address.
3. Edit the patient.
4. Optionally delete a test patient.

Expected result:

- The patient appears in the roster table.
- Edit updates the record.
- Delete removes it if no dependencies block it.

## 4. Claims Setup

Tab:

- `Claims`

What to do first:

1. Use `Provider quick add` to create a provider.
2. Use `Payer quick add` to create a payer.

Expected result:

- Both become available in the claim form dropdowns.

## 5. Claim Draft And Submission

Tab:

- `Claims`

What to do:

1. Select a patient.
2. Select a provider.
3. Select a payer.
4. Add at least one procedure row.
5. Add at least one diagnosis row.
6. Save the claim draft.
7. In the claims queue, click `Submit` for a draft claim.

Expected result:

- The draft is created.
- After submit, claim status becomes `submitted`.
- The claim should also show in the dashboard queue and aging metrics.

## 6. Demo Payment Flow

Tab:

- `Payments`

What to do:

1. Choose a patient.
2. Optionally link the payment to a claim.
3. Enter an amount and description.
4. Click `Create payment link`.
5. Click `Open demo checkout`.
6. On the demo page, click `Simulate success` or `Simulate cancellation`.

Pages involved:

- `/?tab=payments`
- `/payments/demo/[paymentId]`

Expected result:

- A pending payment row is created first.
- Simulated success updates payment status to `paid`.
- If linked to a claim, the claim status becomes `paid`.
- Simulated cancellation updates the payment status to `cancelled`.

## 7. Denials

Tab:

- `Denials`

What to do:

1. Select an existing claim.
2. Add a reason code.
3. Add a reason description.
4. Optionally set an appeal deadline.
5. Save the denial.

Expected result:

- A denial row appears in the denial log.
- The linked claim status becomes `denied`.

## 8. Audit Logs

Tab:

- `Audit` (admin only)

What to do:

1. Sign in as an `admin`.
2. Open the `Audit` tab.
3. Click different audit rows.

Expected result:

- You should see recent inserts and updates for patients, claims, payments, denials, and users.
- The detail panel should show old/new JSON snapshots when available.

## Suggested Full Demo Script

Use this order for the fastest end-to-end demo:

1. Login.
2. Show `Dashboard`.
3. Create a patient in `Patients`.
4. Add provider and payer in `Claims`.
5. Create and submit a claim.
6. Generate a demo payment link in `Payments`.
7. Simulate payment success.
8. Log a denial on another claim if needed.
9. Show `Audit` as admin.

## If Something Fails

Quick checks:

1. Confirm `.env.local` contains the Supabase values.
2. Confirm migrations ran successfully in Supabase.
3. Confirm the user has `org_id` and `role` in app metadata.
4. Confirm the Auth Hook is set to `public.custom_access_token_hook`.
5. Re-sign in after changing auth metadata so the JWT refreshes.
