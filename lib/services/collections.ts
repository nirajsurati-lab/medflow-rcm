import type { SupabaseClient } from "@supabase/supabase-js";

import { isMissingSchemaFeatureError } from "@/lib/services/schema";
import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type ClaimRow = Database["public"]["Tables"]["claims"]["Row"];
type PatientLookup = Pick<
  Database["public"]["Tables"]["patients"]["Row"],
  "id" | "first_name" | "last_name"
>;

export type CollectionSummary = ClaimRow & {
  patient_name: string;
  days_overdue: number;
};

function getDaysOverdue(submittedAt: string | null) {
  if (!submittedAt) {
    return 0;
  }

  const submittedTime = new Date(submittedAt).getTime();
  const diff = Date.now() - submittedTime;

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export async function listCollections(
  supabase: SupabaseClient<Database>,
  profile: UserProfile
) {
  const [claimsResult, patientsResult] = await Promise.all([
    supabase
      .from("claims")
      .select("*")
      .eq("org_id", profile.org_id)
      .in("collections_status", ["overdue", "sent"])
      .order("submitted_at", { ascending: true }),
    supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("org_id", profile.org_id),
  ]);

  if (claimsResult.error || patientsResult.error) {
    if (isMissingSchemaFeatureError(claimsResult.error)) {
      return [];
    }

    throw new Error("Unable to load collections queue.");
  }

  const patientMap = new Map(
    ((patientsResult.data ?? []) as PatientLookup[]).map((patient) => [
      patient.id,
      `${patient.first_name} ${patient.last_name}`.trim(),
    ])
  );

  return ((claimsResult.data ?? []) as ClaimRow[]).map((claim) => ({
    ...claim,
    patient_name: patientMap.get(claim.patient_id) ?? "Unknown patient",
    days_overdue: getDaysOverdue(claim.submitted_at),
  }));
}

export async function updateCollectionClaim(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  id: string,
  input: {
    collections_status?: string;
    dunning_notes?: string | null;
  }
) {
  const payload: Database["public"]["Tables"]["claims"]["Update"] = {};

  if (typeof input.collections_status === "string") {
    payload.collections_status = input.collections_status;
    payload.collections_sent_at =
      input.collections_status === "sent" ? new Date().toISOString() : null;
  }

  if (input.dunning_notes !== undefined) {
    payload.dunning_notes = input.dunning_notes;
  }

  const { data, error } = await supabase
    .from("claims")
    .update(payload)
    .eq("id", id)
    .eq("org_id", profile.org_id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ClaimRow;
}
