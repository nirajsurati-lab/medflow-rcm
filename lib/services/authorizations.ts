import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type AuthorizationRow = Database["public"]["Tables"]["authorizations"]["Row"];
type PatientLookup = Pick<
  Database["public"]["Tables"]["patients"]["Row"],
  "id" | "first_name" | "last_name"
>;
type PayerLookup = Pick<Database["public"]["Tables"]["payers"]["Row"], "id" | "name">;

export type AuthorizationSummary = AuthorizationRow & {
  patient_name: string;
  payer_name: string;
  is_active: boolean;
};

export type ClaimAuthorizationReview = {
  status: "approved" | "missing" | "expired" | "denied";
  missing_codes: string[];
  matched_authorization_id: string | null;
  message: string;
};

function formatPatientName(patient: PatientLookup) {
  return `${patient.first_name} ${patient.last_name}`.trim();
}

function isAuthorizationActive(auth: AuthorizationRow) {
  if (auth.status !== "approved") {
    return false;
  }

  const today = new Date().toISOString().slice(0, 10);

  if (auth.valid_from && auth.valid_from > today) {
    return false;
  }

  if (auth.valid_to && auth.valid_to < today) {
    return false;
  }

  return true;
}

export async function listAuthorizations(
  supabase: SupabaseClient<Database>,
  profile: UserProfile
) {
  const [authorizationsResult, patientsResult, payersResult] = await Promise.all([
    supabase
      .from("authorizations")
      .select("*")
      .eq("org_id", profile.org_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("org_id", profile.org_id),
    supabase.from("payers").select("id, name").eq("org_id", profile.org_id),
  ]);

  if (authorizationsResult.error || patientsResult.error || payersResult.error) {
    throw new Error("Unable to load prior authorizations.");
  }

  const authorizations = (authorizationsResult.data ?? []) as AuthorizationRow[];
  const patientMap = new Map(
    ((patientsResult.data ?? []) as PatientLookup[]).map((patient) => [
      patient.id,
      formatPatientName(patient),
    ])
  );
  const payerMap = new Map(
    ((payersResult.data ?? []) as PayerLookup[]).map((payer) => [payer.id, payer.name])
  );

  return authorizations.map((authorization) => ({
    ...authorization,
    patient_name: patientMap.get(authorization.patient_id) ?? "Unknown patient",
    payer_name: payerMap.get(authorization.payer_id) ?? "Unknown payer",
    is_active: isAuthorizationActive(authorization),
  }));
}

export async function createAuthorization(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  input: {
    patient_id: string;
    payer_id: string;
    procedure_codes: string[];
    status: string;
    valid_from: string | null;
    valid_to: string | null;
    notes: string | null;
    location_id?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("authorizations")
    .insert({
      org_id: profile.org_id,
      location_id: input.location_id ?? null,
      patient_id: input.patient_id,
      payer_id: input.payer_id,
      procedure_codes: input.procedure_codes,
      status: input.status,
      valid_from: input.valid_from,
      valid_to: input.valid_to,
      notes: input.notes,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AuthorizationRow;
}

export async function getClaimAuthorizationReview(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  input: {
    patient_id: string;
    payer_id: string;
    procedure_codes: string[];
  }
): Promise<ClaimAuthorizationReview> {
  const normalizedCodes = input.procedure_codes
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

  if (normalizedCodes.length === 0) {
    return {
      status: "missing",
      missing_codes: [],
      matched_authorization_id: null,
      message: "Add at least one CPT code before evaluating prior authorization.",
    };
  }

  const { data, error } = await supabase
    .from("authorizations")
    .select("*")
    .eq("org_id", profile.org_id)
    .eq("patient_id", input.patient_id)
    .eq("payer_id", input.payer_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const authorizations = (data ?? []) as AuthorizationRow[];
  const matching = authorizations.find((authorization) =>
    normalizedCodes.every((code) =>
      (authorization.procedure_codes ?? []).map((item) => item.toUpperCase()).includes(code)
    )
  );

  if (!matching) {
    return {
      status: "missing",
      missing_codes: normalizedCodes,
      matched_authorization_id: null,
      message:
        "No prior authorization covers all CPT codes on this claim for the selected patient and payer.",
    };
  }

  if (matching.status === "denied") {
    return {
      status: "denied",
      missing_codes: [],
      matched_authorization_id: matching.id,
      message: "The matching prior authorization was denied and the claim cannot be submitted.",
    };
  }

  if (!isAuthorizationActive(matching)) {
    return {
      status: "expired",
      missing_codes: [],
      matched_authorization_id: matching.id,
      message: "The matching prior authorization is not active for the current date range.",
    };
  }

  return {
    status: "approved",
    missing_codes: [],
    matched_authorization_id: matching.id,
    message: "An active approved prior authorization is on file for this claim.",
  };
}
