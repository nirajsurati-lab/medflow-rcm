import type { SupabaseClient } from "@supabase/supabase-js";

import { isMissingSchemaFeatureError } from "@/lib/services/schema";
import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type LocationRow = Database["public"]["Tables"]["locations"]["Row"];

export async function listLocations(
  supabase: SupabaseClient<Database>,
  profile: UserProfile
) {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    if (isMissingSchemaFeatureError(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return (data ?? []) as LocationRow[];
}

export async function createLocation(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  input: {
    name: string;
  }
) {
  const { data, error } = await supabase
    .from("locations")
    .insert({
      org_id: profile.org_id,
      name: input.name,
      is_default: false,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as LocationRow;
}

export async function updateLocation(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  id: string,
  input: {
    name: string;
  }
) {
  const { data, error } = await supabase
    .from("locations")
    .update({
      name: input.name,
    })
    .eq("id", id)
    .eq("org_id", profile.org_id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as LocationRow;
}
