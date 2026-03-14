import { redirect } from "next/navigation";

import { LocationsAdmin } from "@/components/admin/locations-admin";
import { PageShell } from "@/components/system/page-shell";
import { getCurrentUserContext } from "@/lib/auth/session";
import { listLocations } from "@/lib/services/locations";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LocationsPage() {
  const userContext = await getCurrentUserContext();

  if (!userContext) {
    redirect("/login");
  }

  if (!userContext.profile || userContext.profile.role !== "admin") {
    redirect("/");
  }

  const supabase = createAdminSupabaseClient() ?? (await createServerSupabaseClient());
  const locations = await listLocations(supabase, userContext.profile);

  return (
    <PageShell tone="workspace" containerClassName="max-w-none">
      <LocationsAdmin locations={locations} />
    </PageShell>
  );
}
