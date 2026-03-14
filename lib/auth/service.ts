import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { loginSchema } from "@/lib/validators/auth";

type LoginFailure = {
  ok: false;
  error: string;
  status: 400 | 401 | 403 | 500;
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

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();

    return {
      ok: false,
      error:
        "Your account is missing a MedFlow Pro staff profile. Ask an admin to provision your org and role.",
      status: 403,
    };
  }

  await supabase
    .from("users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", data.user.id);

  return {
    ok: true,
    user: data.user,
  };
}
