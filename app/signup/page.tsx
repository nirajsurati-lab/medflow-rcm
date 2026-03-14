import type { Metadata } from "next";

import { AuthShell } from "@/components/auth-shell";
import { FormField } from "@/components/system/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SUPABASE_PUBLIC_ENV_KEYS,
  getSupabaseConfigStatus,
} from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Sign Up",
};

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const config = getSupabaseConfigStatus();
  const errorMessage =
    typeof params.error === "string" ? params.error : undefined;
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const canSubmit = config.isConfigured && hasServiceRoleKey;

  return (
    <AuthShell
      eyebrow="Workspace Bootstrap"
      heading="Create your first MedFlow Pro organization admin."
      description="Bootstrap a fresh demo workspace with one organization and one internal admin account. This is the fastest way to get the Phase 4 app running end to end."
      cardTitle="Create a MedFlow Pro workspace"
      cardDescription="Sign up creates a new organization plus its first admin user. After signup, you can sign in immediately."
      alternateHref="/login"
      alternateLabel="Sign in here"
      alternateText="Already have an account?"
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to sign up</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {!config.isConfigured ? (
        <Alert>
          <AlertTitle>Supabase is not configured yet</AlertTitle>
          <AlertDescription>
            Add these keys to `.env.local`: {SUPABASE_PUBLIC_ENV_KEYS.join(", ")}.
          </AlertDescription>
        </Alert>
      ) : null}

      {!hasServiceRoleKey ? (
        <Alert>
          <AlertTitle>Service role key is required for signup</AlertTitle>
          <AlertDescription>
            Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` so the signup flow can
            create the organization and first admin user.
          </AlertDescription>
        </Alert>
      ) : null}

      <form action="/api/auth/signup" method="post" className="space-y-5">
        <FormField label="Organization name" htmlFor="organization_name">
          <Input
            id="organization_name"
            name="organization_name"
            placeholder="Northwind Medical Group"
            required
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name" htmlFor="first_name">
            <Input id="first_name" name="first_name" required />
          </FormField>
          <FormField label="Last name" htmlFor="last_name">
            <Input id="last_name" name="last_name" required />
          </FormField>
        </div>

        <FormField label="Work email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="admin@medflowpro.com"
            required
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Password" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </FormField>
          <FormField label="Confirm password" htmlFor="confirm_password">
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </FormField>
        </div>

        <Button className="w-full" size="lg" type="submit" disabled={!canSubmit}>
          Create workspace
        </Button>
      </form>
    </AuthShell>
  );
}
