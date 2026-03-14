import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
type ClaimRow = Database["public"]["Tables"]["claims"]["Row"];
type PatientLookup = Pick<
  Database["public"]["Tables"]["patients"]["Row"],
  "id" | "first_name" | "last_name"
>;
type ProviderLookup = Pick<
  Database["public"]["Tables"]["providers"]["Row"],
  "id" | "first_name" | "last_name"
>;
type PayerLookup = Pick<Database["public"]["Tables"]["payers"]["Row"], "id" | "name">;

export type AppointmentSummary = AppointmentRow & {
  patient_name: string;
  provider_name: string;
  payer_name: string;
};

export async function listAppointments(
  supabase: SupabaseClient<Database>,
  profile: UserProfile
) {
  const [appointmentsResult, patientsResult, providersResult, payersResult] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .eq("org_id", profile.org_id)
        .order("scheduled_at", { ascending: false }),
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

  if (
    appointmentsResult.error ||
    patientsResult.error ||
    providersResult.error ||
    payersResult.error
  ) {
    throw new Error("Unable to load appointments.");
  }

  const patientMap = new Map(
    ((patientsResult.data ?? []) as PatientLookup[]).map((patient) => [
      patient.id,
      `${patient.first_name} ${patient.last_name}`.trim(),
    ])
  );
  const providerMap = new Map(
    ((providersResult.data ?? []) as ProviderLookup[]).map((provider) => [
      provider.id,
      `${provider.first_name} ${provider.last_name}`.trim(),
    ])
  );
  const payerMap = new Map(
    ((payersResult.data ?? []) as PayerLookup[]).map((payer) => [payer.id, payer.name])
  );

  return ((appointmentsResult.data ?? []) as AppointmentRow[]).map((appointment) => ({
    ...appointment,
    patient_name: patientMap.get(appointment.patient_id) ?? "Unknown patient",
    provider_name: providerMap.get(appointment.provider_id) ?? "Unknown provider",
    payer_name: appointment.payer_id
      ? payerMap.get(appointment.payer_id) ?? "Unknown payer"
      : "No payer",
  }));
}

export async function createAppointment(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  input: {
    patient_id: string;
    provider_id: string;
    payer_id: string | null;
    scheduled_at: string;
    type: string;
    status: string;
    billing_status: string;
    location_id?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      org_id: profile.org_id,
      location_id: input.location_id ?? null,
      patient_id: input.patient_id,
      provider_id: input.provider_id,
      payer_id: input.payer_id,
      scheduled_at: input.scheduled_at,
      type: input.type,
      status: input.status,
      billing_status: input.billing_status,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AppointmentRow;
}

export async function completeAppointmentAndCreateClaimDraft(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  id: string
) {
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("org_id", profile.org_id)
    .maybeSingle();

  if (appointmentError || !appointment) {
    throw new Error("Appointment not found.");
  }

  const typedAppointment = appointment as AppointmentRow;

  if (!typedAppointment.payer_id) {
    throw new Error("Add a payer before completing the appointment.");
  }

  if (typedAppointment.claim_id) {
    const { data: updatedAppointment, error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "completed",
        billing_status: "claimed",
      })
      .eq("id", typedAppointment.id)
      .eq("org_id", profile.org_id)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return {
      appointment: updatedAppointment as AppointmentRow,
      claim: null,
    };
  }

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .insert({
      org_id: profile.org_id,
      location_id: typedAppointment.location_id,
      appointment_id: typedAppointment.id,
      patient_id: typedAppointment.patient_id,
      provider_id: typedAppointment.provider_id,
      payer_id: typedAppointment.payer_id,
      status: "draft",
      collections_status: "none",
      total_amount: 0,
    })
    .select("*")
    .single();

  if (claimError) {
    throw new Error(claimError.message);
  }

  const typedClaim = claim as ClaimRow;
  const { data: updatedAppointment, error: updateError } = await supabase
    .from("appointments")
    .update({
      status: "completed",
      billing_status: "claimed",
      claim_id: typedClaim.id,
    })
    .eq("id", typedAppointment.id)
    .eq("org_id", profile.org_id)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    appointment: updatedAppointment as AppointmentRow,
    claim: typedClaim,
  };
}
