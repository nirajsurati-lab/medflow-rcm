import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type ProviderInsert = Database["public"]["Tables"]["providers"]["Insert"];
type PayerInsert = Database["public"]["Tables"]["payers"]["Insert"];
type ProviderRow = Database["public"]["Tables"]["providers"]["Row"];
type PayerRow = Database["public"]["Tables"]["payers"]["Row"];

export async function listProviders(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .order("last_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProviderRow[];
}

export async function listPayers(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("payers")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PayerRow[];
}

export async function createProvider(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  input: {
    first_name: string;
    last_name: string;
    npi: string;
    specialty: string | null;
  }
) {
  const payload: ProviderInsert = {
    org_id: profile.org_id,
    first_name: input.first_name,
    last_name: input.last_name,
    npi: input.npi,
    specialty: input.specialty,
    credentials_status: "active",
  };

  const { data, error } = await supabase
    .from("providers")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ProviderRow;
}

export async function createPayer(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  input: {
    name: string;
    payer_id: string;
    contact_email: string | null;
    contact_phone: string | null;
  }
) {
  const contactInfo: Json | null =
    input.contact_email || input.contact_phone
      ? {
          email: input.contact_email,
          phone: input.contact_phone,
        }
      : null;

  const payload: PayerInsert = {
    org_id: profile.org_id,
    name: input.name,
    payer_id: input.payer_id,
    contact_info: contactInfo,
  };

  const { data, error } = await supabase
    .from("payers")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PayerRow;
}
