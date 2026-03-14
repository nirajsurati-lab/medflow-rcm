import type { SupabaseClient, User } from "@supabase/supabase-js";

import { isInternalRole } from "@/lib/auth/roles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

type AuthorizedContext = {
  ok: true;
  authUser: User;
  profile: UserProfile;
  supabase: SupabaseClient<Database>;
};

type UnauthorizedContext = {
  ok: false;
  error: string;
  status: 401 | 403 | 500;
};

export type InternalRequestContext = AuthorizedContext | UnauthorizedContext;

export async function getInternalRequestContext(): Promise<InternalRequestContext> {
  const sessionSupabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  const {
    data: { user },
    error,
  } = await sessionSupabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      error: "Unauthorized",
      status: 401,
    };
  }

  const { data: profile, error: profileError } = await sessionSupabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  let typedProfile = (profile ?? null) as UserProfile | null;

  if (!typedProfile) {
    if (adminSupabase) {
      const { data: adminProfile } = await adminSupabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      typedProfile = (adminProfile ?? null) as UserProfile | null;
    }
  }

  if (!typedProfile) {
    return {
      ok: false,
      error:
        profileError?.message ?? "User profile is missing.",
      status: 403,
    };
  }

  if (!isInternalRole(typedProfile.role)) {
    return {
      ok: false,
      error: "Forbidden",
      status: 403,
    };
  }

  // Temporary compatibility path while the live Supabase RLS helpers
  // are still unstable. Every feature service continues to scope queries
  // by `profile.org_id`, so org isolation remains explicit in code.
  const databaseSupabase = adminSupabase ?? sessionSupabase;

  return {
    ok: true,
    authUser: user,
    profile: typedProfile,
    supabase: databaseSupabase,
  };
}
