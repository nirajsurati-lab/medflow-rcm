import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type DenialRow = Database["public"]["Tables"]["denials"]["Row"];
type DenialClaimLookup = Pick<
  Database["public"]["Tables"]["claims"]["Row"],
  "id" | "status"
>;

export type DenialSummary = DenialRow & {
  claim_status: string;
};

export async function listDenials(supabase: SupabaseClient<Database>) {
  const [denialsResult, claimsResult] = await Promise.all([
    supabase
      .from("denials")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("claims").select("id, status"),
  ]);

  if (denialsResult.error || claimsResult.error) {
    throw new Error("Unable to load denials.");
  }

  const denials = (denialsResult.data ?? []) as DenialRow[];
  const claims = (claimsResult.data ?? []) as DenialClaimLookup[];

  const claimStatusMap = new Map(
    claims.map((claim) => [claim.id, claim.status])
  );

  return denials.map((denial) => ({
    ...denial,
    claim_status: claimStatusMap.get(denial.claim_id) ?? "unknown",
  }));
}

export async function createDenial(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  input: {
    claim_id: string;
    reason_code: string;
    reason_desc: string;
    appeal_deadline: string | null;
  }
) {
  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id")
    .eq("id", input.claim_id)
    .maybeSingle();

  if (claimError || !claim) {
    throw new Error("Claim not found.");
  }

  const { data: denial, error: denialError } = await supabase
    .from("denials")
    .insert({
      org_id: profile.org_id,
      claim_id: input.claim_id,
      reason_code: input.reason_code,
      reason_desc: input.reason_desc,
      appeal_deadline: input.appeal_deadline,
      status: "open",
    })
    .select("*")
    .single();

  if (denialError) {
    throw new Error(denialError.message);
  }

  const { error: claimUpdateError } = await supabase
    .from("claims")
    .update({
      status: "denied",
    })
    .eq("id", input.claim_id);

  if (claimUpdateError) {
    throw new Error(claimUpdateError.message);
  }

  return denial as DenialRow;
}
