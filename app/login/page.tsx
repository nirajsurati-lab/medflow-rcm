import type { Metadata } from "next";

import { loginAction } from "@/app/login/actions";
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
  title: "Login",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const config = getSupabaseConfigStatus();
  const errorMessage =
    typeof params.error === "string" ? params.error : undefined;
  const successMessage =
    typeof params.success === "string" ? params.success : undefined;

  return (
    <AuthShell
      eyebrow="Phase 4 Workspace"
      heading="Internal billing workflows, now with reporting and audit visibility."
      description="Sign in to manage manual patient intake, claim drafting, denial logging, demo payments, KPI dashboards, and audit history inside one org-scoped workspace."
      cardTitle="Sign in to MedFlow Pro"
      cardDescription="Use an existing staff account, or create a new demo workspace from the signup page."
      alternateHref="/signup"
      alternateLabel="Create a workspace"
      alternateText="Need a new org admin account?"
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to sign in</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert>
          <AlertTitle>Signup completed</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
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

      <form action={loginAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="biller@medflowpro.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
        </div>

        <Button
          className="h-10 w-full bg-slate-950 text-white hover:bg-slate-800"
          type="submit"
          disabled={!config.isConfigured}
        >
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
