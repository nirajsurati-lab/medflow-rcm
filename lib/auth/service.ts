import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { loginSchema } from "@/lib/validators/auth";

type LoginFailure = {
  ok: false;
  error: string;
  status: 400 | 401 | 500;
};

type LoginSuccess = {
  ok: true;
  user: User;
};

type LoginResult = LoginFailure | LoginSuccess;

export async function loginWithPassword(
  supabase: SupabaseClient<Database>,
  input: unknown
): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Enter a valid email address and password.",
      status: 400,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return {
      ok: false,
      error: "Invalid email or password.",
      status: 401,
    };
  }

  // The authenticated request after redirect is the reliable place to enforce
  // profile/RLS checks. Doing that immediately after sign-in can race the new
  // SSR session cookies and produce false "missing profile" errors.
  void supabase
    .from("users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", data.user.id);

  return {
    ok: true,
    user: data.user,
  };
}
