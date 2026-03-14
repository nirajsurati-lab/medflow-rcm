import type { SupabaseClient } from "@supabase/supabase-js";

import { getClaimAuthorizationReview } from "@/lib/services/authorizations";
import { findAllowedAmountForCode } from "@/lib/services/contracts";
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
  allowed_total: number;
  procedures: Array<{
    id: string;
    cpt_code: string;
    description: string | null;
    units: number;
    charge_amount: number;
    allowed_amount: number;
  }>;
  diagnoses: Array<{
    id: string;
    icd10_code: string;
    description: string | null;
    sequence: number;
  }>;
};

function formatPersonName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export async function listClaims(
  supabase: SupabaseClient<Database>,
  profile: UserProfile
) {
  const [
    claimsResult,
    patientsResult,
    providersResult,
    payersResult,
    proceduresResult,
    diagnosesResult,
  ] =
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
      supabase
        .from("procedures")
        .select("id, claim_id, cpt_code, description, units, charge_amount, allowed_amount")
        .eq("org_id", profile.org_id),
      supabase
        .from("diagnoses")
        .select("id, claim_id, icd10_code, description, sequence")
        .eq("org_id", profile.org_id),
    ]);

  if (claimsResult.error) {
    throw new Error(claimsResult.error.message);
  }

  if (
    patientsResult.error ||
    providersResult.error ||
    payersResult.error ||
    proceduresResult.error ||
    diagnosesResult.error
  ) {
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
  const allowedMap = new Map<string, number>();

  const procedureMap = new Map<
    string,
    ClaimSummary["procedures"]
  >();

  for (const procedure of (proceduresResult.data ?? []) as Array<{
    id?: string;
    claim_id: string;
    cpt_code?: string;
    description?: string | null;
    units?: number;
    charge_amount?: number;
    allowed_amount: number;
  }>) {
    allowedMap.set(
      procedure.claim_id,
      (allowedMap.get(procedure.claim_id) ?? 0) + procedure.allowed_amount
    );

    const claimProcedures = procedureMap.get(procedure.claim_id) ?? [];
    claimProcedures.push({
      id: procedure.id ?? "",
      cpt_code: procedure.cpt_code ?? "",
      description: procedure.description ?? null,
      units: procedure.units ?? 0,
      charge_amount: procedure.charge_amount ?? 0,
      allowed_amount: procedure.allowed_amount,
    });
    procedureMap.set(procedure.claim_id, claimProcedures);
  }

  const diagnosisMap = new Map<string, ClaimSummary["diagnoses"]>();

  for (const diagnosis of (diagnosesResult.data ?? []) as Array<{
    id: string;
    claim_id: string;
    icd10_code: string;
    description: string | null;
    sequence: number;
  }>) {
    const claimDiagnoses = diagnosisMap.get(diagnosis.claim_id) ?? [];
    claimDiagnoses.push({
      id: diagnosis.id,
      icd10_code: diagnosis.icd10_code,
      description: diagnosis.description,
      sequence: diagnosis.sequence,
    });
    diagnosisMap.set(diagnosis.claim_id, claimDiagnoses);
  }

  return claims.map((claim) => ({
    ...claim,
    patient_name: patientMap.get(claim.patient_id) ?? "Unknown patient",
    provider_name: providerMap.get(claim.provider_id) ?? "Unknown provider",
    payer_name: payerMap.get(claim.payer_id) ?? "Unknown payer",
    allowed_total: Number((allowedMap.get(claim.id) ?? 0).toFixed(2)),
    procedures: procedureMap.get(claim.id) ?? [],
    diagnoses: diagnosisMap.get(claim.id) ?? [],
  }));
}

export async function updateClaim(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  id: string,
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
  const { data: currentClaim, error: currentClaimError } = await supabase
    .from("claims")
    .select("*")
    .eq("id", id)
    .eq("org_id", profile.org_id)
    .maybeSingle();

  if (currentClaimError || !currentClaim) {
    throw new Error("Claim not found.");
  }

  const typedCurrentClaim = currentClaim as ClaimRow;

  if (typedCurrentClaim.status !== "draft") {
    throw new Error("Only draft claims can be edited.");
  }

  const normalizedProcedures = await Promise.all(
    input.procedures.map(async (procedure) => {
      const derivedAllowedAmount =
        procedure.allowed_amount > 0
          ? procedure.allowed_amount
          : await findAllowedAmountForCode(supabase, profile, {
              payer_id: input.payer_id,
              cpt_code: procedure.cpt_code,
            });

      return {
        ...procedure,
        allowed_amount: Number((derivedAllowedAmount ?? 0).toFixed(2)),
      };
    })
  );

  const totalAmount = normalizedProcedures.reduce(
    (sum, procedure) => sum + procedure.charge_amount * procedure.units,
    0
  );

  const { error: claimError } = await supabase
    .from("claims")
    .update({
      patient_id: input.patient_id,
      provider_id: input.provider_id,
      payer_id: input.payer_id,
      total_amount: Number(totalAmount.toFixed(2)),
    })
    .eq("id", id)
    .eq("org_id", profile.org_id);

  if (claimError) {
    throw new Error(claimError.message);
  }

  await supabase.from("procedures").delete().eq("claim_id", id).eq("org_id", profile.org_id);
  await supabase.from("diagnoses").delete().eq("claim_id", id).eq("org_id", profile.org_id);

  const proceduresPayload: ProcedureInsert[] = normalizedProcedures.map((procedure) => ({
    ...procedure,
    org_id: profile.org_id,
    claim_id: id,
  }));
  const diagnosesPayload: DiagnosisInsert[] = input.diagnoses.map((diagnosis) => ({
    ...diagnosis,
    org_id: profile.org_id,
    claim_id: id,
  }));

  const { error: proceduresError } = await supabase
    .from("procedures")
    .insert(proceduresPayload);
  const { error: diagnosesError } = await supabase
    .from("diagnoses")
    .insert(diagnosesPayload);

  if (proceduresError || diagnosesError) {
    throw new Error(
      proceduresError?.message ?? diagnosesError?.message ?? "Unable to update claim lines."
    );
  }

  const { data, error } = await supabase
    .from("claims")
    .select("*")
    .eq("id", id)
    .eq("org_id", profile.org_id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ClaimRow;
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
      .select("id, location_id")
      .eq("id", input.patient_id)
      .eq("org_id", profile.org_id)
      .maybeSingle(),
    supabase
      .from("providers")
      .select("id, location_id")
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

  const normalizedProcedures = await Promise.all(
    input.procedures.map(async (procedure) => {
      const derivedAllowedAmount =
        procedure.allowed_amount > 0
          ? procedure.allowed_amount
          : await findAllowedAmountForCode(supabase, profile, {
              payer_id: input.payer_id,
              cpt_code: procedure.cpt_code,
            });

      return {
        ...procedure,
        allowed_amount: Number((derivedAllowedAmount ?? 0).toFixed(2)),
      };
    })
  );

  const totalAmount = input.procedures.reduce(
    (sum, procedure) => sum + procedure.charge_amount * procedure.units,
    0
  );

  const claimPayload: ClaimInsert = {
    org_id: profile.org_id,
    location_id:
      (patientResult.data as { location_id: string | null }).location_id ??
      (providerResult.data as { location_id: string | null }).location_id ??
      null,
    patient_id: input.patient_id,
    provider_id: input.provider_id,
    payer_id: input.payer_id,
    total_amount: Number(totalAmount.toFixed(2)),
    status: "draft",
    collections_status: "none",
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

  const proceduresPayload: ProcedureInsert[] = normalizedProcedures.map(
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
  const [claimResult, proceduresResult, diagnosesResult] = await Promise.all([
    supabase
      .from("claims")
      .select("*")
      .eq("id", id)
      .eq("org_id", profile.org_id)
      .maybeSingle(),
    supabase.from("procedures").select("cpt_code").eq("claim_id", id).eq("org_id", profile.org_id),
    supabase.from("diagnoses").select("id").eq("claim_id", id).eq("org_id", profile.org_id),
  ]);

  if (claimResult.error || !claimResult.data) {
    throw new Error("Claim not found.");
  }

  if (proceduresResult.error || diagnosesResult.error) {
    throw new Error("Unable to validate claim lines.");
  }

  const procedures = (proceduresResult.data ?? []) as Array<{ cpt_code: string }>;
  const diagnoses = diagnosesResult.data ?? [];

  if (procedures.length === 0 || diagnoses.length === 0) {
    throw new Error(
      "This draft claim is missing CPT or ICD-10 detail. Complete the claim builder before submission."
    );
  }

  const typedClaim = claimResult.data as ClaimRow;
  const authReview = await getClaimAuthorizationReview(supabase, profile, {
    patient_id: typedClaim.patient_id,
    payer_id: typedClaim.payer_id,
    procedure_codes: procedures.map((procedure) => procedure.cpt_code),
  });

  if (authReview.status !== "approved") {
    throw new Error(authReview.message);
  }

  const { data, error } = await supabase
    .from("claims")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      collections_status: "none",
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
