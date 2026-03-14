import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listClaims, type ClaimSummary } from "@/lib/services/claims";
import { listDenials, type DenialSummary } from "@/lib/services/denials";
import { listPayers, listProviders } from "@/lib/services/lookups";
import { listPatients } from "@/lib/services/patients";
import { listPayments, type PaymentSummary } from "@/lib/services/payments";

export type DashboardKpi = {
  label: string;
  value: number;
  kind: "currency" | "number" | "percent";
  helper: string;
};

export type DashboardAgingBucket = {
  label: string;
  amount: number;
  claim_count: number;
};

export type DashboardClaimQueueItem = ClaimSummary & {
  days_open: number;
  aging_bucket: string;
  recommended_action: string;
  outstanding_amount: number;
};

export type DashboardSummary = {
  kpis: DashboardKpi[];
  aging_buckets: DashboardAgingBucket[];
  claims_queue: DashboardClaimQueueItem[];
};

export type PhaseTwoWorkspaceData = {
  patients: Awaited<ReturnType<typeof listPatients>>;
  providers: Awaited<ReturnType<typeof listProviders>>;
  payers: Awaited<ReturnType<typeof listPayers>>;
  claims: ClaimSummary[];
  denials: DenialSummary[];
  payments: PaymentSummary[];
  dashboard: DashboardSummary;
};

function getDaysOpen(dateValue: string) {
  const currentTime = Date.now();
  const baseTime = new Date(dateValue).getTime();
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.max(0, Math.floor((currentTime - baseTime) / millisecondsPerDay));
}

function getAgingBucketLabel(daysOpen: number) {
  if (daysOpen <= 30) {
    return "0-30";
  }

  if (daysOpen <= 60) {
    return "31-60";
  }

  if (daysOpen <= 90) {
    return "61-90";
  }

  return "91+";
}

function getRecommendedClaimAction(claim: ClaimSummary, daysOpen: number) {
  if (claim.status === "draft") {
    return "Review and submit";
  }

  if (claim.status === "denied") {
    return "Appeal or correct";
  }

  if (claim.status === "paid") {
    return "Reconciled";
  }

  if (daysOpen > 30) {
    return "Follow up with payer";
  }

  return "Monitor adjudication";
}

function buildDashboardSummary(
  claims: ClaimSummary[],
  payments: PaymentSummary[],
  denials: DenialSummary[]
): DashboardSummary {
  const openClaims = claims.filter((claim) => claim.status !== "paid");
  const submittedClaims = claims.filter((claim) => claim.status === "submitted");
  const deniedClaims = claims.filter((claim) => claim.status === "denied");
  const paidPayments = payments.filter((payment) => payment.status === "paid");

  const totalOutstandingAR = openClaims.reduce(
    (sum, claim) => sum + claim.total_amount,
    0
  );
  const totalPatientPayments = paidPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const denialRate = claims.length > 0 ? (deniedClaims.length / claims.length) * 100 : 0;

  const queue = openClaims
    .map((claim) => {
      const referenceDate = claim.submitted_at ?? claim.created_at;
      const daysOpen = getDaysOpen(referenceDate);

      return {
        ...claim,
        days_open: daysOpen,
        aging_bucket: getAgingBucketLabel(daysOpen),
        recommended_action: getRecommendedClaimAction(claim, daysOpen),
        outstanding_amount: claim.total_amount,
      };
    })
    .sort((left, right) => right.days_open - left.days_open);

  const bucketOrder = ["0-30", "31-60", "61-90", "91+"];
  const agingBuckets = bucketOrder.map((label) => {
    const claimsInBucket = queue.filter((claim) => claim.aging_bucket === label);

    return {
      label,
      amount: claimsInBucket.reduce(
        (sum, claim) => sum + claim.outstanding_amount,
        0
      ),
      claim_count: claimsInBucket.length,
    };
  });

  return {
    kpis: [
      {
        label: "Outstanding A/R",
        value: totalOutstandingAR,
        kind: "currency",
        helper: `${openClaims.length} unpaid claims in queue`,
      },
      {
        label: "Submitted Claims",
        value: submittedClaims.length,
        kind: "number",
        helper: "Claims waiting on payer action",
      },
      {
        label: "Denial Rate",
        value: denialRate,
        kind: "percent",
        helper: `${denials.length} denial records logged`,
      },
      {
        label: "Patient Payments",
        value: totalPatientPayments,
        kind: "currency",
        helper: `${paidPayments.length} demo payments marked paid`,
      },
    ],
    aging_buckets: agingBuckets,
    claims_queue: queue,
  };
}

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
  const dashboard = buildDashboardSummary(claims, payments, denials);

  return {
    patients,
    providers,
    payers,
    claims,
    denials,
    payments,
    dashboard,
  };
}
