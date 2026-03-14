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

  let organization: OrganizationRow | null = null;

  if (profile?.org_id) {
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.org_id)
      .maybeSingle<OrganizationRow>();

    organization = data ?? null;
  }

  return {
    authUser: user,
    profile: profile ?? null,
    organization,
  };
}
