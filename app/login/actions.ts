"use server";

import { redirect } from "next/navigation";

import { loginWithPassword } from "@/lib/auth/service";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function buildLoginRedirect(error: string) {
  const searchParams = new URLSearchParams({ error });
  return `/login?${searchParams.toString()}`;
}

export async function loginAction(formData: FormData) {
  if (!getSupabaseConfigStatus().isConfigured) {
    redirect(
      buildLoginRedirect(
        "Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first."
      )
    );
  }

  const supabase = await createServerSupabaseClient();
  const result = await loginWithPassword(supabase, {
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.ok) {
    redirect(buildLoginRedirect(result.error));
  }

  redirect("/");
}
