import { redirect } from "next/navigation";

import { ContractsAdmin } from "@/components/admin/contracts-admin";
import { PageShell } from "@/components/system/page-shell";
import { getCurrentUserContext } from "@/lib/auth/session";
import { listFeeSchedules } from "@/lib/services/contracts";
import { listPayers } from "@/lib/services/lookups";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ContractsPage() {
  const userContext = await getCurrentUserContext();

  if (!userContext) {
    redirect("/login");
  }

  if (!userContext.profile || userContext.profile.role !== "admin") {
    redirect("/");
  }

  const supabase = createAdminSupabaseClient() ?? (await createServerSupabaseClient());
  const [feeSchedules, payers] = await Promise.all([
    listFeeSchedules(supabase, userContext.profile),
    listPayers(supabase, userContext.profile),
  ]);

  return (
    <PageShell tone="workspace" containerClassName="max-w-none">
      <ContractsAdmin payers={payers} feeSchedules={feeSchedules} />
    </PageShell>
  );
}
