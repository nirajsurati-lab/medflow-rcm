"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnvOrThrow } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

let browserClient:
  | ReturnType<typeof createBrowserClient<Database>>
  | undefined;

export function createBrowserSupabaseClient() {
  if (!browserClient) {
    const { anonKey, url } = getSupabaseEnvOrThrow();

    browserClient = createBrowserClient<Database>(url, anonKey);
  }

  return browserClient;
}
