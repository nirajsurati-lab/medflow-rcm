import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnvOrThrow } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export function createAdminSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || serviceRoleKey.trim().length === 0) {
    return null;
  }

  const { url } = getSupabaseEnvOrThrow();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
