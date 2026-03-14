import { redirect } from "next/navigation";
import {
  Activity,
  DatabaseZap,
  ShieldCheck,
  UserRound,
  Workflow,
} from "lucide-react";

import { PhaseTwoWorkspace } from "@/components/phase-two-workspace";
import { AppCard, AppCardDescription, AppCardHeader, AppCardTitle } from "@/components/system/card";
import { PageHeader } from "@/components/system/page-header";
import { PageShell } from "@/components/system/page-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/auth/session";
import { getPhaseTwoWorkspaceData } from "@/lib/services/workspace";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  SUPABASE_PUBLIC_ENV_KEYS,
  getSupabaseConfigStatus,
} from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

function SetupCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof DatabaseZap;
}) {
  return (
    <AppCard className="border-border/70 bg-white/76">
      <AppCardHeader className="space-y-3 px-5 py-5">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-sky-700 shadow-sm">
          <Icon className="size-5" />
        </div>
        <div className="space-y-1.5">
          <AppCardTitle>{title}</AppCardTitle>
          <AppCardDescription>{description}</AppCardDescription>
        </div>
      </AppCardHeader>
    </AppCard>
  );
}

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
      <PageShell tone="default">
        <div className="space-y-6">
          <PageHeader
            eyebrow="Setup Required"
            title="MedFlow Pro is scaffolded and waiting for Supabase"
            description="Add your environment variables, run the migrations, and the login screen will be ready to use."
            stats={[
              {
                label: "Missing env",
                value: SUPABASE_PUBLIC_ENV_KEYS.join(", "),
              },
              {
                label: "Mode",
                value: "Pre-auth setup",
              },
            ]}
          />

          <Alert>
            <AlertTitle>Missing environment variables</AlertTitle>
            <AlertDescription>
              Add the following keys to `.env.local`:{" "}
              {SUPABASE_PUBLIC_ENV_KEYS.join(", ")}.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-3">
            <SetupCard
              title="Apply schema"
              description="Run the SQL files in `supabase/migrations/` so the core tables, policies, and triggers exist."
              icon={DatabaseZap}
            />
            <SetupCard
              title="Configure auth hook"
              description="Set the Supabase custom access token hook so role and organization context flow into the app."
              icon={ShieldCheck}
            />
            <SetupCard
              title="Provision users"
              description="Create an organization and at least one admin user before signing in."
              icon={UserRound}
            />
          </div>
        </div>
      </PageShell>
    );
  }

  const userContext = await getCurrentUserContext();

  if (!userContext) {
    redirect("/login");
  }

  const { authUser, organization, profile } = userContext;
  const sanitizedInitialTab =
    params?.tab === "audit" && profile?.role !== "admin" ? "dashboard" : initialTab;
  const workspaceSupabase =
    createAdminSupabaseClient() ?? (await createServerSupabaseClient());
  const workspaceData = profile
    ? await getPhaseTwoWorkspaceData(workspaceSupabase, profile)
    : null;

  if (profile && workspaceData) {
    return (
      <PageShell
        tone="workspace"
        className="px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5"
        containerClassName="max-w-none"
      >
        <PhaseTwoWorkspace
          data={workspaceData}
          initialTab={sanitizedInitialTab}
          paymentStatus={paymentStatus}
          organizationName={organization?.name ?? "Unknown organization"}
          userRole={profile.role}
          userEmail={authUser.email ?? "No email returned"}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      tone="workspace"
      className="px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5"
      containerClassName="max-w-none"
    >
      <div className="space-y-6">
        <PageHeader
          eyebrow="Operations Workspace"
          title="MedFlow Pro workspace is ready, but the data layer still needs attention"
          description="Auth is working and the new workspace shell is in place. Resolve the remaining profile or data hydration issue to unlock the full dashboard."
          stats={[
            {
              label: "Organization",
              value: organization?.name ?? "Unknown organization",
            },
            {
              label: "User",
              value: authUser.email ?? "No email returned",
            },
            ...(profile
              ? [
                  {
                    label: "Role",
                    value: profile.role,
                  },
                ]
              : []),
          ]}
          action={
            <form action="/api/auth/logout" method="post">
              <Button variant="outline" type="submit">
                Sign out
              </Button>
            </form>
          }
        />

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
          <SetupCard
            title="Session confirmed"
            description={`Signed in as ${authUser.email ?? "Unknown user"} with ${profile?.role ?? "unknown"} access.`}
            icon={UserRound}
          />
          <SetupCard
            title="Data hydration"
            description="The workspace could not fully load org-scoped data. Check RLS, seed data, and table contents before reloading."
            icon={DatabaseZap}
          />
          <SetupCard
            title="What unlocks next"
            description="Patients, claims, payments, denials, dashboards, and audit visibility will appear once the org data loads."
            icon={Workflow}
          />
        </div>

        {profile && !workspaceData ? (
          <AppCard className="border-border/70 bg-white/76">
            <AppCardHeader className="px-6 py-6">
              <div className="flex items-start gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-sky-700 shadow-sm">
                  <Activity className="size-5" />
                </div>
                <div className="space-y-2">
                  <AppCardTitle className="text-xl">Workspace data load failed</AppCardTitle>
                  <AppCardDescription>
                    Confirm the org has patient, claim, payment, denial, and lookup records available under the current policies, then refresh the page.
                  </AppCardDescription>
                </div>
              </div>
            </AppCardHeader>
          </AppCard>
        ) : null}
      </div>
    </PageShell>
  );
}
