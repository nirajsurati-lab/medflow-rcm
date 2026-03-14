"use server";

import { redirect } from "next/navigation";

import { getSupabaseConfigStatus } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function logoutAction() {
  if (getSupabaseConfigStatus().isConfigured) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
