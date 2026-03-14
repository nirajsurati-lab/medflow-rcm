import type { Metadata } from "next";

import { signupAction } from "@/app/signup/actions";
import { AuthShell } from "@/components/auth-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

      <form action={signupAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="organization_name">Organization name</Label>
          <Input
            id="organization_name"
            name="organization_name"
            placeholder="Northwind Medical Group"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" name="first_name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" name="last_name" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="admin@medflowpro.com"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm password</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </div>

        <Button
          className="h-10 w-full bg-slate-950 text-white hover:bg-slate-800"
          type="submit"
          disabled={!canSubmit}
        >
          Create workspace
        </Button>
      </form>
    </AuthShell>
  );
}
