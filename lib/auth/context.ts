import type { SupabaseClient, User } from "@supabase/supabase-js";

import { isInternalRole } from "@/lib/auth/roles";
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
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      error: "Unauthorized",
      status: 401,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const typedProfile = (profile ?? null) as UserProfile | null;

  if (profileError || !typedProfile) {
    return {
      ok: false,
      error: "User profile is missing.",
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

  return {
    ok: true,
    authUser: user,
    profile: typedProfile,
    supabase,
  };
}
