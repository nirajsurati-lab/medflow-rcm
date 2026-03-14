import type { SupabaseClient } from "@supabase/supabase-js";

import { isMissingSchemaFeatureError } from "@/lib/services/schema";
import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type CredentialingRow = Database["public"]["Tables"]["credentialing"]["Row"];
type ProviderLookup = Pick<
  Database["public"]["Tables"]["providers"]["Row"],
  "id" | "first_name" | "last_name"
>;
type PayerLookup = Pick<Database["public"]["Tables"]["payers"]["Row"], "id" | "name">;

export type CredentialingSummary = CredentialingRow & {
  provider_name: string;
  payer_name: string;
  expires_soon: boolean;
  is_expired: boolean;
};

function getDaysUntil(dateValue: string | null) {
  if (!dateValue) {
    return null;
  }

  const diff = new Date(dateValue).getTime() - Date.now();

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function listCredentialing(
  supabase: SupabaseClient<Database>,
  profile: UserProfile
) {
  const [credentialingResult, providersResult, payersResult] = await Promise.all([
    supabase
      .from("credentialing")
      .select("*")
      .eq("org_id", profile.org_id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("providers")
      .select("id, first_name, last_name")
      .eq("org_id", profile.org_id),
    supabase.from("payers").select("id, name").eq("org_id", profile.org_id),
  ]);

  if (credentialingResult.error || providersResult.error || payersResult.error) {
    if (isMissingSchemaFeatureError(credentialingResult.error)) {
      return [];
    }

    throw new Error("Unable to load credentialing records.");
  }

  const providerMap = new Map(
    ((providersResult.data ?? []) as ProviderLookup[]).map((provider) => [
      provider.id,
      `${provider.first_name} ${provider.last_name}`.trim(),
    ])
  );
  const payerMap = new Map(
    ((payersResult.data ?? []) as PayerLookup[]).map((payer) => [payer.id, payer.name])
  );

  return ((credentialingResult.data ?? []) as CredentialingRow[]).map((record) => {
    const daysUntilExpiry = getDaysUntil(record.expiry_date);

    return {
      ...record,
      provider_name: providerMap.get(record.provider_id) ?? "Unknown provider",
      payer_name: payerMap.get(record.payer_id) ?? "Unknown payer",
      expires_soon: daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 60,
      is_expired: daysUntilExpiry !== null && daysUntilExpiry < 0,
    };
  });
}

export async function upsertCredentialing(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  input: {
    provider_id: string;
    payer_id: string;
    status: string;
    submitted_at: string | null;
    approved_at: string | null;
    expiry_date: string | null;
    notes: string | null;
    location_id?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("credentialing")
    .upsert(
      {
        org_id: profile.org_id,
        location_id: input.location_id ?? null,
        provider_id: input.provider_id,
        payer_id: input.payer_id,
        status: input.status,
        submitted_at: input.submitted_at,
        approved_at: input.approved_at,
        expiry_date: input.expiry_date,
        notes: input.notes,
      },
      {
        onConflict: "org_id,provider_id,payer_id",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CredentialingRow;
}
