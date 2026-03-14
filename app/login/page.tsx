import type { Metadata } from "next";
import { HeartPulse, LockKeyhole, ShieldCheck } from "lucide-react";

import { loginAction } from "@/app/login/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f3faf8_0%,#eef4ff_45%,#fffaf2_100%)] px-6 py-10 text-foreground sm:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200/70 bg-white/75 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm backdrop-blur">
            <HeartPulse className="size-4" />
            MedFlow Pro
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Revenue Cycle MVP
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Internal billing workflows, grounded in Supabase auth and
              tenant-safe data access.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Phase 1 focuses on a clean staff login, org-aware row level
              security, and the full schema foundation for patients, claims,
              denials, and reporting.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-white/70 bg-white/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-700" />
                  RLS-first
                </CardTitle>
                <CardDescription>
                  Every tenant table is scoped to an organization.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-white/70 bg-white/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LockKeyhole className="size-4 text-sky-700" />
                  Staff auth
                </CardTitle>
                <CardDescription>
                  Admin and biller roles are provisioned through Supabase Auth.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-white/70 bg-white/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HeartPulse className="size-4 text-amber-700" />
                  Manual MVP
                </CardTitle>
                <CardDescription>
                  No eligibility, no AI coding, no clearinghouse integration.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <Card className="border-white/80 bg-white/85 shadow-xl shadow-slate-200/70 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-slate-950">
              Sign in to MedFlow Pro
            </CardTitle>
            <CardDescription className="leading-6">
              Use a Supabase Auth user that already has an organization and role
              provisioned in the `public.users` table.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to sign in</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            {!config.isConfigured ? (
              <Alert>
                <AlertTitle>Supabase is not configured yet</AlertTitle>
                <AlertDescription>
                  Add these keys to `.env.local`:{" "}
                  {SUPABASE_PUBLIC_ENV_KEYS.join(", ")}.
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

            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              Create auth users in Supabase with app metadata containing
              `org_id` and `role`, then set the custom access token hook to
              `public.custom_access_token_hook`.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
