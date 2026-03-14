import type { SupabaseClient } from "@supabase/supabase-js";

import {
  listAuthorizations,
  type AuthorizationSummary,
} from "@/lib/services/authorizations";
import { listAuditLogs, type AuditLogSummary } from "@/lib/services/audit-logs";
import { listAppointments, type AppointmentSummary } from "@/lib/services/appointments";
import { listClaims, type ClaimSummary } from "@/lib/services/claims";
import { listCollections, type CollectionSummary } from "@/lib/services/collections";
import { listFeeSchedules, type FeeScheduleSummary } from "@/lib/services/contracts";
import {
  listCredentialing,
  type CredentialingSummary,
} from "@/lib/services/credentialing";
import { listDenials, type DenialSummary } from "@/lib/services/denials";
import { listPayers, listProviders } from "@/lib/services/lookups";
import { listPatients } from "@/lib/services/patients";
import { listPayments, type PaymentSummary } from "@/lib/services/payments";
import { listLocations } from "@/lib/services/locations";
import { listStatements, type StatementSummary } from "@/lib/services/statements";
import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

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
  credentialing_summary: {
    total: number;
    expiring_soon: number;
    expired: number;
  };
};

export type PhaseTwoWorkspaceData = {
  patients: Awaited<ReturnType<typeof listPatients>>;
  providers: Awaited<ReturnType<typeof listProviders>>;
  payers: Awaited<ReturnType<typeof listPayers>>;
  locations: Awaited<ReturnType<typeof listLocations>>;
  claims: ClaimSummary[];
  denials: DenialSummary[];
  payments: PaymentSummary[];
  authorizations: AuthorizationSummary[];
  statements: StatementSummary[];
  collections: CollectionSummary[];
  appointments: AppointmentSummary[];
  fee_schedules: FeeScheduleSummary[];
  credentialing: CredentialingSummary[];
  dashboard: DashboardSummary;
  audit_logs: AuditLogSummary[];
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
  denials: DenialSummary[],
  collections: CollectionSummary[],
  credentialing: CredentialingSummary[]
): DashboardSummary {
  const openClaims = claims.filter((claim) => claim.status !== "paid");
  const submittedClaims = claims.filter((claim) => claim.status === "submitted");
  const deniedClaims = claims.filter((claim) => claim.status === "denied");
  const paidPayments = payments.filter(
    (payment) => payment.status === "succeeded"
  );

  const totalOutstandingAR = openClaims.reduce(
    (sum, claim) => sum + claim.total_amount,
    0
  );
  const totalPatientPayments = paidPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const denialRate = claims.length > 0 ? (deniedClaims.length / claims.length) * 100 : 0;
  const overdueExposure = collections.reduce(
    (sum, claim) => sum + claim.total_amount,
    0
  );

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
        helper: `${paidPayments.length} demo payments completed`,
      },
      {
        label: "Overdue Exposure",
        value: overdueExposure,
        kind: "currency",
        helper: `${collections.length} claims in collections workflow`,
      },
    ],
    aging_buckets: agingBuckets,
    claims_queue: queue,
    credentialing_summary: {
      total: credentialing.length,
      expiring_soon: credentialing.filter((item) => item.expires_soon).length,
      expired: credentialing.filter((item) => item.is_expired).length,
    },
  };
}

export async function getPhaseTwoWorkspaceData(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  locationId?: string | null
): Promise<PhaseTwoWorkspaceData> {
  const [
    patients,
    providers,
    payers,
    locations,
    claims,
    denials,
    payments,
    authorizations,
    statements,
    collections,
    appointments,
    feeSchedules,
    credentialing,
    auditLogs,
  ] =
    await Promise.all([
      listPatients(supabase, profile),
      listProviders(supabase, profile),
      listPayers(supabase, profile),
      listLocations(supabase, profile),
      listClaims(supabase, profile),
      listDenials(supabase, profile),
      listPayments(supabase, profile),
      listAuthorizations(supabase, profile),
      listStatements(supabase, profile),
      listCollections(supabase, profile),
      listAppointments(supabase, profile),
      listFeeSchedules(supabase, profile),
      listCredentialing(supabase, profile),
      profile.role === "admin"
        ? listAuditLogs(supabase, profile)
        : Promise.resolve([]),
    ]);
  const resolvedPatients = locationId
    ? patients.filter((patient) => patient.location_id === locationId)
    : patients;
  const resolvedProviders = locationId
    ? providers.filter((provider) => provider.location_id === locationId)
    : providers;
  const resolvedClaims = locationId
    ? claims.filter((claim) => claim.location_id === locationId)
    : claims;
  const resolvedClaimIds = new Set(resolvedClaims.map((claim) => claim.id));
  const resolvedDenials = locationId
    ? denials.filter((denial) => resolvedClaimIds.has(denial.claim_id))
    : denials;
  const resolvedPayments = locationId
    ? payments.filter((payment) => payment.location_id === locationId)
    : payments;
  const resolvedAuthorizations = locationId
    ? authorizations.filter((authorization) => authorization.location_id === locationId)
    : authorizations;
  const resolvedStatements = locationId
    ? statements.filter((statement) => statement.location_id === locationId)
    : statements;
  const resolvedCollections = locationId
    ? collections.filter((claim) => claim.location_id === locationId)
    : collections;
  const resolvedAppointments = locationId
    ? appointments.filter((appointment) => appointment.location_id === locationId)
    : appointments;
  const resolvedCredentialing = locationId
    ? credentialing.filter((item) => item.location_id === locationId)
    : credentialing;
  const dashboard = buildDashboardSummary(
    resolvedClaims,
    resolvedPayments,
    resolvedDenials,
    resolvedCollections,
    resolvedCredentialing
  );

  return {
    patients: resolvedPatients,
    providers: resolvedProviders,
    payers,
    locations,
    claims: resolvedClaims,
    denials: resolvedDenials,
    payments: resolvedPayments,
    authorizations: resolvedAuthorizations,
    statements: resolvedStatements,
    collections: resolvedCollections,
    appointments: resolvedAppointments,
    fee_schedules: feeSchedules,
    credentialing: resolvedCredentialing,
    dashboard,
    audit_logs: auditLogs,
  };
}
