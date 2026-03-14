import { redirect } from "next/navigation";
import { Activity, DatabaseZap, ShieldCheck, UserRound } from "lucide-react";

import { logoutAction } from "@/app/actions/logout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PhaseTwoWorkspace } from "@/components/phase-two-workspace";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserContext } from "@/lib/auth/session";
import { getPhaseTwoWorkspaceData } from "@/lib/services/workspace";
import {
  SUPABASE_PUBLIC_ENV_KEYS,
  getSupabaseConfigStatus,
} from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const validTabs = new Set([
  "dashboard",
  "patients",
  "claims",
  "payments",
  "denials",
  "audit",
]);

type HomeProps = {
  searchParams?: Promise<{
    tab?: string;
    status?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const config = getSupabaseConfigStatus();
  const params = searchParams ? await searchParams : undefined;
  const initialTab =
    params?.tab && validTabs.has(params.tab) ? params.tab : "dashboard";
  const paymentStatus =
    params?.status === "success" || params?.status === "cancelled"
      ? params.status
      : null;

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
  const sanitizedInitialTab =
    params?.tab === "audit" && profile?.role !== "admin" ? "dashboard" : initialTab;
  const workspaceData = profile ? await getPhaseTwoWorkspaceData(profile.role) : null;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3faf8_0%,#f7fbff_45%,#fdf8f3_100%)] px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="border-white/80 bg-white/85 shadow-lg shadow-slate-200/70 backdrop-blur">
          <CardHeader className="gap-3 md:flex md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl text-slate-950">
                MedFlow Pro Phase 3 workspace
              </CardTitle>
              <CardDescription className="max-w-2xl leading-6">
                KPI reporting, A/R aging visibility, and a claims follow-up queue
                now sit on top of the manual billing workflows from Phase 2.
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
        ) : workspaceData ? (
          <PhaseTwoWorkspace
            data={workspaceData}
            initialTab={sanitizedInitialTab}
            paymentStatus={paymentStatus}
            organizationName={organization?.name ?? "Unknown organization"}
            userRole={profile.role}
          />
        ) : (
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
                  <p>{profile.role}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/80 bg-white/85 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DatabaseZap className="size-4 text-sky-700" />
                  Data load
                </CardTitle>
                <CardDescription>
                  The workspace could not hydrate org-scoped Phase 4 data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <p>Check your RLS setup and confirm seed data exists.</p>
                <p>Then refresh the page and try again.</p>
              </CardContent>
            </Card>

            <Card className="border-white/80 bg-white/85 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-4 text-amber-700" />
                  Next up
                </CardTitle>
                <CardDescription>
                  Once data loads, the Phase 4 operations tabs will appear here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <p>Patient CRUD with org-scoped queries</p>
                <p>Manual claim creation and submission flow</p>
                <p>Demo payment link generation</p>
                <p>Manual denial capture and resubmission flags</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
