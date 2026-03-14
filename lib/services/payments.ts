import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type PaymentPatientLookup = Pick<
  Database["public"]["Tables"]["patients"]["Row"],
  "id" | "first_name" | "last_name"
>;

export type PaymentSummary = PaymentRow & {
  patient_name: string;
};

function formatPatientName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export async function listPayments(supabase: SupabaseClient<Database>) {
  const [paymentsResult, patientsResult] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("patients").select("id, first_name, last_name"),
  ]);

  if (paymentsResult.error || patientsResult.error) {
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

  return payments.map((payment) => ({
    ...payment,
    patient_name: patientMap.get(payment.patient_id) ?? "Unknown patient",
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
    .select("id, first_name, last_name")
    .eq("id", input.patient_id)
    .maybeSingle();

  if (patientError || !patient) {
    throw new Error("Patient not found.");
  }

  if (input.claim_id) {
    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .select("id")
      .eq("id", input.claim_id)
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
      claim_id: input.claim_id,
      patient_id: input.patient_id,
      amount: Number(input.amount.toFixed(2)),
      method: "demo",
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
  id: string,
  status: "paid" | "cancelled"
) {
  const nextTimestamp = status === "paid" ? new Date().toISOString() : null;
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .update({
      status,
      received_at: nextTimestamp,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  const typedPayment = payment as PaymentRow;

  if (typedPayment.claim_id) {
    const claimUpdates =
      status === "paid"
        ? {
            status: "paid",
            paid_at: nextTimestamp,
          }
        : {
            status: "submitted",
            paid_at: null,
          };

    const { error: claimError } = await supabase
      .from("claims")
      .update(claimUpdates)
      .eq("id", typedPayment.claim_id);

    if (claimError) {
      throw new Error(claimError.message);
    }
  }

  return typedPayment;
}
