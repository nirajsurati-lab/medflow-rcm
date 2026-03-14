import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export async function listPatients(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PatientRow[];
}

export async function getPatientById(
  supabase: SupabaseClient<Database>,
  id: string
) {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
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
  id: string,
  input: Database["public"]["Tables"]["patients"]["Update"]
) {
  const { data, error } = await supabase
    .from("patients")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PatientRow;
}

export async function deletePatient(
  supabase: SupabaseClient<Database>,
  id: string
) {
  const { error } = await supabase.from("patients").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
