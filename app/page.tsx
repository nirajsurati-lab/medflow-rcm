import { redirect } from "next/navigation";
import {
  Activity,
  Building2,
  DatabaseZap,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { logoutAction } from "@/app/actions/logout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserContext } from "@/lib/auth/session";
import {
  SUPABASE_PUBLIC_ENV_KEYS,
  getSupabaseConfigStatus,
} from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

function formatLastSeen(value: string | null) {
  if (!value) {
    return "First login pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function Home() {
  const config = getSupabaseConfigStatus();

  if (!config.isConfigured) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#fdf8f3_100%)] px-6 py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="border-white/80 bg-white/85 shadow-lg shadow-slate-200/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-3xl text-slate-950">
                MedFlow Pro is scaffolded and waiting for Supabase
              </CardTitle>
              <CardDescription className="leading-6">
                Add your environment variables, run the migrations, and the
                login screen will be ready to use.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTitle>Missing environment variables</AlertTitle>
                <AlertDescription>
                  Add the following keys to `.env.local`:{" "}
                  {SUPABASE_PUBLIC_ENV_KEYS.join(", ")}.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-3">
                <Card size="sm" className="border border-slate-200/70 bg-slate-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DatabaseZap className="size-4 text-sky-700" />
                      Schema
                    </CardTitle>
                    <CardDescription>
                      Apply the SQL files in `supabase/migrations/`.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card size="sm" className="border border-slate-200/70 bg-slate-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-emerald-700" />
                      Auth hook
                    </CardTitle>
                    <CardDescription>
                      Set the Supabase custom access token hook.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card size="sm" className="border border-slate-200/70 bg-slate-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserRound className="size-4 text-amber-700" />
                      Users
                    </CardTitle>
                    <CardDescription>
                      Provision an org and at least one admin user.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const userContext = await getCurrentUserContext();

  if (!userContext) {
    redirect("/login");
  }

  const { authUser, organization, profile } = userContext;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3faf8_0%,#f7fbff_45%,#fdf8f3_100%)] px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="border-white/80 bg-white/85 shadow-lg shadow-slate-200/70 backdrop-blur">
          <CardHeader className="gap-3 md:flex md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl text-slate-950">
                Phase 1 control room
              </CardTitle>
              <CardDescription className="max-w-2xl leading-6">
                The project scaffold, Supabase SSR auth wiring, and tenant-safe
                schema migrations are in place. This screen confirms the current
                session and organization context before we move into patients and
                claims in Phase 2.
              </CardDescription>
            </div>
            <form action={logoutAction}>
              <Button variant="outline" type="submit">
                Sign out
              </Button>
            </form>
          </CardHeader>
        </Card>

        {!profile ? (
          <Alert variant="destructive">
            <AlertTitle>User profile missing</AlertTitle>
            <AlertDescription>
              Auth succeeded for {authUser.email}, but there is no matching row
              in `public.users`. Provision the account with an `org_id` and
              `role`, then sign in again.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-white/80 bg-white/85 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-4 text-emerald-700" />
                Session
              </CardTitle>
              <CardDescription>
                The active Supabase Auth account for this browser session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div>
                <p className="font-medium text-slate-950">Email</p>
                <p>{authUser.email ?? "No email returned"}</p>
              </div>
              <div>
                <p className="font-medium text-slate-950">Role</p>
                <p>{profile?.role ?? "Unassigned"}</p>
              </div>
              <div>
                <p className="font-medium text-slate-950">Last login</p>
                <p>{formatLastSeen(profile?.last_login ?? null)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/85 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4 text-sky-700" />
                Organization
              </CardTitle>
              <CardDescription>
                The tenant context pulled through the authenticated profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div>
                <p className="font-medium text-slate-950">Name</p>
                <p>{organization?.name ?? "Not found"}</p>
              </div>
              <div>
                <p className="font-medium text-slate-950">Plan tier</p>
                <p>{organization?.plan_tier ?? "Not set"}</p>
              </div>
              <div>
                <p className="font-medium text-slate-950">Org ID</p>
                <p className="break-all font-mono text-xs text-slate-600">
                  {profile?.org_id ?? "Unavailable"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/85 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-4 text-amber-700" />
                Next up
              </CardTitle>
              <CardDescription>
                Phase 2 will build against the schema and auth base already in
                place.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>Patient CRUD with org-scoped queries</p>
              <p>Manual claim creation and submission flow</p>
              <p>Stripe checkout session link generation</p>
              <p>Manual denial capture and resubmission flags</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
