import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type FeeScheduleRow = Database["public"]["Tables"]["fee_schedules"]["Row"];
type PayerLookup = Pick<Database["public"]["Tables"]["payers"]["Row"], "id" | "name">;

export type FeeScheduleSummary = FeeScheduleRow & {
  payer_name: string;
};

export async function listFeeSchedules(
  supabase: SupabaseClient<Database>,
  profile: UserProfile
) {
  const [feeSchedulesResult, payersResult] = await Promise.all([
    supabase
      .from("fee_schedules")
      .select("*")
      .eq("org_id", profile.org_id)
      .order("effective_date", { ascending: false }),
    supabase.from("payers").select("id, name").eq("org_id", profile.org_id),
  ]);

  if (feeSchedulesResult.error || payersResult.error) {
    throw new Error("Unable to load fee schedules.");
  }

  const payerMap = new Map(
    ((payersResult.data ?? []) as PayerLookup[]).map((payer) => [payer.id, payer.name])
  );

  return ((feeSchedulesResult.data ?? []) as FeeScheduleRow[]).map((item) => ({
    ...item,
    payer_name: payerMap.get(item.payer_id) ?? "Unknown payer",
  }));
}

export async function createFeeSchedule(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  input: {
    payer_id: string;
    cpt_code: string;
    allowed_amount: number;
    effective_date: string;
  }
) {
  const { data, error } = await supabase
    .from("fee_schedules")
    .insert({
      org_id: profile.org_id,
      payer_id: input.payer_id,
      cpt_code: input.cpt_code,
      allowed_amount: input.allowed_amount,
      effective_date: input.effective_date,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FeeScheduleRow;
}

export async function findAllowedAmountForCode(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  input: {
    payer_id: string;
    cpt_code: string;
    service_date?: string | null;
  }
) {
  const serviceDate = input.service_date ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("fee_schedules")
    .select("*")
    .eq("org_id", profile.org_id)
    .eq("payer_id", input.payer_id)
    .eq("cpt_code", input.cpt_code)
    .lte("effective_date", serviceDate)
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as FeeScheduleRow | null)?.allowed_amount ?? null;
}
