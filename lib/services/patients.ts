import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export async function listPatients(
  supabase: SupabaseClient<Database>,
  profile: UserProfile
) {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PatientRow[];
}

export async function getPatientById(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  id: string
) {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .eq("org_id", profile.org_id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Patient not found.");
  }

  return data as PatientRow;
}

export async function createPatient(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  input: Omit<PatientInsert, "org_id">
) {
  const payload: PatientInsert = {
    ...input,
    org_id: profile.org_id,
  };

  const { data, error } = await supabase
    .from("patients")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PatientRow;
}

export async function updatePatient(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  id: string,
  input: Database["public"]["Tables"]["patients"]["Update"]
) {
  const { data, error } = await supabase
    .from("patients")
    .update(input)
    .eq("id", id)
    .eq("org_id", profile.org_id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PatientRow;
}

export async function deletePatient(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  id: string
) {
  const { error } = await supabase
    .from("patients")
    .delete()
    .eq("id", id)
    .eq("org_id", profile.org_id);

  if (error) {
    throw new Error(error.message);
  }
}
