import { redirect } from "next/navigation";

import { CredentialingAdmin } from "@/components/admin/credentialing-admin";
import { PageShell } from "@/components/system/page-shell";
import { getCurrentUserContext } from "@/lib/auth/session";
import { listCredentialing } from "@/lib/services/credentialing";
import { listPayers, listProviders } from "@/lib/services/lookups";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CredentialingPage() {
  const userContext = await getCurrentUserContext();

  if (!userContext) {
    redirect("/login");
  }

  if (!userContext.profile || userContext.profile.role !== "admin") {
    redirect("/");
  }

  const supabase = createAdminSupabaseClient() ?? (await createServerSupabaseClient());
  const [records, providers, payers] = await Promise.all([
    listCredentialing(supabase, userContext.profile),
    listProviders(supabase, userContext.profile),
    listPayers(supabase, userContext.profile),
  ]);

  return (
    <PageShell tone="workspace" containerClassName="max-w-none">
      <CredentialingAdmin records={records} providers={providers} payers={payers} />
    </PageShell>
  );
}
