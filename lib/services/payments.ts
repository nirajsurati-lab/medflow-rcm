import type { SupabaseClient } from "@supabase/supabase-js";

import { ensureStatementForClaim } from "@/lib/services/statements";
import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type PaymentPatientLookup = Pick<
  Database["public"]["Tables"]["patients"]["Row"],
  "id" | "first_name" | "last_name"
>;

export type PaymentSummary = PaymentRow & {
  patient_name: string;
  billed_amount: number;
  allowed_amount: number;
  variance_amount: number;
};

function formatPatientName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export async function listPayments(
  supabase: SupabaseClient<Database>,
  profile: UserProfile
) {
  const [paymentsResult, patientsResult, claimsResult, proceduresResult] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .eq("org_id", profile.org_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("org_id", profile.org_id),
    supabase.from("claims").select("id, total_amount").eq("org_id", profile.org_id),
    supabase.from("procedures").select("claim_id, allowed_amount").eq("org_id", profile.org_id),
  ]);

  if (
    paymentsResult.error ||
    patientsResult.error ||
    claimsResult.error ||
    proceduresResult.error
  ) {
    throw new Error("Unable to load payments.");
  }

  const payments = (paymentsResult.data ?? []) as PaymentRow[];
  const patients = (patientsResult.data ?? []) as PaymentPatientLookup[];

  const patientMap = new Map(
    patients.map((patient) => [
      patient.id,
      formatPatientName(patient.first_name, patient.last_name),
    ])
  );
  const claimMap = new Map(
    ((claimsResult.data ?? []) as Array<{ id: string; total_amount: number }>).map((claim) => [
      claim.id,
      claim.total_amount,
    ])
  );
  const allowedMap = new Map<string, number>();

  for (const procedure of (proceduresResult.data ?? []) as Array<{
    claim_id: string;
    allowed_amount: number;
  }>) {
    allowedMap.set(
      procedure.claim_id,
      (allowedMap.get(procedure.claim_id) ?? 0) + procedure.allowed_amount
    );
  }

  return payments.map((payment) => ({
    ...payment,
    patient_name: patientMap.get(payment.patient_id) ?? "Unknown patient",
    billed_amount: payment.claim_id ? claimMap.get(payment.claim_id) ?? payment.amount : payment.amount,
    allowed_amount: payment.claim_id ? allowedMap.get(payment.claim_id) ?? 0 : 0,
    variance_amount:
      payment.amount -
      (payment.claim_id ? allowedMap.get(payment.claim_id) ?? payment.amount : payment.amount),
  }));
}

export async function createCheckoutPaymentLink(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  input: {
    patient_id: string;
    claim_id: string | null;
    amount: number;
    description: string;
    origin: string;
  }
) {
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id, first_name, last_name, location_id")
    .eq("id", input.patient_id)
    .eq("org_id", profile.org_id)
    .maybeSingle();

  if (patientError || !patient) {
    throw new Error("Patient not found.");
  }

  if (input.claim_id) {
    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .select("id")
      .eq("id", input.claim_id)
      .eq("org_id", profile.org_id)
      .maybeSingle();

    if (claimError || !claim) {
      throw new Error("Claim not found.");
    }
  }

  const typedPatient = patient as PaymentPatientLookup;
  const patientName = `${typedPatient.first_name} ${typedPatient.last_name}`.trim();

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      org_id: profile.org_id,
      location_id: (typedPatient as PaymentPatientLookup & { location_id?: string | null }).location_id ?? null,
      claim_id: input.claim_id,
      patient_id: input.patient_id,
      amount: Number(input.amount.toFixed(2)),
      method: "other",
      stripe_id: null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  const typedPayment = payment as PaymentRow;
  const paymentUrl = new URL(
    `/payments/demo/${typedPayment.id}`,
    input.origin
  );
  paymentUrl.searchParams.set("amount", input.amount.toFixed(2));
  paymentUrl.searchParams.set("description", input.description);
  paymentUrl.searchParams.set("patient", patientName);

  return {
    payment: typedPayment,
    url: paymentUrl.toString(),
  };
}

export async function simulatePaymentStatus(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  id: string,
  status: "succeeded" | "voided"
) {
  const nextTimestamp = status === "succeeded" ? new Date().toISOString() : null;
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .update({
      status,
      received_at: nextTimestamp,
    })
    .eq("id", id)
    .eq("org_id", profile.org_id)
    .select("*")
    .single();

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  const typedPayment = payment as PaymentRow;

  if (typedPayment.claim_id && status === "succeeded") {
    const statement = await ensureStatementForClaim(
      supabase,
      profile,
      typedPayment.claim_id
    );

    if (!statement) {
      const { error: claimError } = await supabase
        .from("claims")
        .update({
          status: "paid",
          paid_at: nextTimestamp,
        })
        .eq("id", typedPayment.claim_id)
        .eq("org_id", profile.org_id);

      if (claimError) {
        throw new Error(claimError.message);
      }
    }
  }

  return typedPayment;
}
