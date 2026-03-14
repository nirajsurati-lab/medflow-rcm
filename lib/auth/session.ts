import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];

export async function getCurrentUserContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<UserRow>();

  let resolvedProfile = profile ?? null;

  if (!resolvedProfile) {
    const adminSupabase = createAdminSupabaseClient();

    if (adminSupabase) {
      const { data } = await adminSupabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle<UserRow>();

      resolvedProfile = data ?? null;
    }
  }

  let organization: OrganizationRow | null = null;

  if (resolvedProfile?.org_id) {
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", resolvedProfile.org_id)
      .maybeSingle<OrganizationRow>();

    organization = data ?? null;

    if (!organization) {
      const adminSupabase = createAdminSupabaseClient();

      if (adminSupabase) {
        const { data: adminOrganization } = await adminSupabase
          .from("organizations")
          .select("*")
          .eq("id", resolvedProfile.org_id)
          .maybeSingle<OrganizationRow>();

        organization = adminOrganization ?? null;
      }
    }
  }

  return {
    authUser: user,
    profile: resolvedProfile,
    organization,
  };
}
