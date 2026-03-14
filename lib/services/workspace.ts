import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listClaims, type ClaimSummary } from "@/lib/services/claims";
import { listDenials, type DenialSummary } from "@/lib/services/denials";
import { listPayers, listProviders } from "@/lib/services/lookups";
import { listPatients } from "@/lib/services/patients";
import { listPayments, type PaymentSummary } from "@/lib/services/payments";

export type PhaseTwoWorkspaceData = {
  patients: Awaited<ReturnType<typeof listPatients>>;
  providers: Awaited<ReturnType<typeof listProviders>>;
  payers: Awaited<ReturnType<typeof listPayers>>;
  claims: ClaimSummary[];
  denials: DenialSummary[];
  payments: PaymentSummary[];
};

export async function getPhaseTwoWorkspaceData(): Promise<PhaseTwoWorkspaceData> {
  const supabase = await createServerSupabaseClient();
  const [patients, providers, payers, claims, denials, payments] =
    await Promise.all([
      listPatients(supabase),
      listProviders(supabase),
      listPayers(supabase),
      listClaims(supabase),
      listDenials(supabase),
      listPayments(supabase),
    ]);

  return {
    patients,
    providers,
    payers,
    claims,
    denials,
    payments,
  };
}
