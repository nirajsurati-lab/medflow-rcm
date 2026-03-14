import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type ClaimInsert = Database["public"]["Tables"]["claims"]["Insert"];
type ClaimRow = Database["public"]["Tables"]["claims"]["Row"];
type ProcedureInsert = Database["public"]["Tables"]["procedures"]["Insert"];
type DiagnosisInsert = Database["public"]["Tables"]["diagnoses"]["Insert"];
type ClaimPatientLookup = Pick<
  Database["public"]["Tables"]["patients"]["Row"],
  "id" | "first_name" | "last_name"
>;
type ClaimProviderLookup = Pick<
  Database["public"]["Tables"]["providers"]["Row"],
  "id" | "first_name" | "last_name"
>;
type ClaimPayerLookup = Pick<
  Database["public"]["Tables"]["payers"]["Row"],
  "id" | "name"
>;

export type ClaimSummary = ClaimRow & {
  patient_name: string;
  provider_name: string;
  payer_name: string;
};

function formatPersonName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export async function listClaims(
  supabase: SupabaseClient<Database>,
  profile: UserProfile
) {
  const [claimsResult, patientsResult, providersResult, payersResult] =
    await Promise.all([
      supabase
        .from("claims")
        .select("*")
        .eq("org_id", profile.org_id)
        .order("created_at", { ascending: false }),
      supabase
        .from("patients")
        .select("id, first_name, last_name")
        .eq("org_id", profile.org_id),
      supabase
        .from("providers")
        .select("id, first_name, last_name")
        .eq("org_id", profile.org_id),
      supabase.from("payers").select("id, name").eq("org_id", profile.org_id),
    ]);

  if (claimsResult.error) {
    throw new Error(claimsResult.error.message);
  }

  if (patientsResult.error || providersResult.error || payersResult.error) {
    throw new Error("Unable to load claim relationships.");
  }

  const claims = (claimsResult.data ?? []) as ClaimRow[];
  const patients = (patientsResult.data ?? []) as ClaimPatientLookup[];
  const providers = (providersResult.data ?? []) as ClaimProviderLookup[];
  const payers = (payersResult.data ?? []) as ClaimPayerLookup[];

  const patientMap = new Map(
    patients.map((patient) => [
      patient.id,
      formatPersonName(patient.first_name, patient.last_name),
    ])
  );
  const providerMap = new Map(
    providers.map((provider) => [
      provider.id,
      formatPersonName(provider.first_name, provider.last_name),
    ])
  );
  const payerMap = new Map(payers.map((payer) => [payer.id, payer.name]));

  return claims.map((claim) => ({
    ...claim,
    patient_name: patientMap.get(claim.patient_id) ?? "Unknown patient",
    provider_name: providerMap.get(claim.provider_id) ?? "Unknown provider",
    payer_name: payerMap.get(claim.payer_id) ?? "Unknown payer",
  }));
}

export async function createClaim(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  input: {
    patient_id: string;
    provider_id: string;
    payer_id: string;
    procedures: Array<{
      cpt_code: string;
      description: string | null;
      units: number;
      charge_amount: number;
      allowed_amount: number;
    }>;
    diagnoses: Array<{
      icd10_code: string;
      description: string | null;
      sequence: number;
    }>;
  }
) {
  const [patientResult, providerResult, payerResult] = await Promise.all([
    supabase
      .from("patients")
      .select("id")
      .eq("id", input.patient_id)
      .eq("org_id", profile.org_id)
      .maybeSingle(),
    supabase
      .from("providers")
      .select("id")
      .eq("id", input.provider_id)
      .eq("org_id", profile.org_id)
      .maybeSingle(),
    supabase
      .from("payers")
      .select("id")
      .eq("id", input.payer_id)
      .eq("org_id", profile.org_id)
      .maybeSingle(),
  ]);

  if (!patientResult.data || !providerResult.data || !payerResult.data) {
    throw new Error("Patient, provider, or payer not found for this organization.");
  }

  const totalAmount = input.procedures.reduce(
    (sum, procedure) => sum + procedure.charge_amount * procedure.units,
    0
  );

  const claimPayload: ClaimInsert = {
    org_id: profile.org_id,
    patient_id: input.patient_id,
    provider_id: input.provider_id,
    payer_id: input.payer_id,
    total_amount: Number(totalAmount.toFixed(2)),
    status: "draft",
  };

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .insert(claimPayload)
    .select("*")
    .single();

  if (claimError) {
    throw new Error(claimError.message);
  }
  const typedClaim = claim as ClaimRow;

  const proceduresPayload: ProcedureInsert[] = input.procedures.map(
    (procedure) => ({
      ...procedure,
      org_id: profile.org_id,
      claim_id: typedClaim.id,
    })
  );
  const diagnosesPayload: DiagnosisInsert[] = input.diagnoses.map((diagnosis) => ({
    ...diagnosis,
    org_id: profile.org_id,
    claim_id: typedClaim.id,
  }));

  const { error: proceduresError } = await supabase
    .from("procedures")
    .insert(proceduresPayload);
  const { error: diagnosesError } = await supabase
    .from("diagnoses")
    .insert(diagnosesPayload);

  if (proceduresError || diagnosesError) {
    await supabase
      .from("claims")
      .delete()
      .eq("id", typedClaim.id)
      .eq("org_id", profile.org_id);

    throw new Error(
      proceduresError?.message ?? diagnosesError?.message ?? "Unable to create claim lines."
    );
  }

  return typedClaim;
}

export async function submitClaim(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  id: string
) {
  const { data, error } = await supabase
    .from("claims")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("org_id", profile.org_id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ClaimRow;
}
