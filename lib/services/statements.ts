import { randomBytes } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { isMissingSchemaFeatureError } from "@/lib/services/schema";
import { createStripeServerClient } from "@/lib/stripe/server";
import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type StatementRow = Database["public"]["Tables"]["statements"]["Row"];
type StatementLineItemRow = Database["public"]["Tables"]["statement_line_items"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type ClaimRow = Database["public"]["Tables"]["claims"]["Row"];
type AdjustmentRow = Database["public"]["Tables"]["adjustments"]["Row"];
type PatientLookup = Pick<
  Database["public"]["Tables"]["patients"]["Row"],
  "id" | "first_name" | "last_name"
>;

export type StatementSummary = StatementRow & {
  patient_name: string;
  claim_amount: number;
  public_url: string | null;
  line_items: StatementLineItemRow[];
};

export type PublicStatementView = {
  statement: StatementSummary;
};

function formatPatientName(patient: PatientLookup) {
  return `${patient.first_name} ${patient.last_name}`.trim();
}

function getPublicToken() {
  return randomBytes(24).toString("hex");
}

function getPublicStatementUrl(origin: string, statement: StatementRow) {
  if (!statement.public_token) {
    return null;
  }

  const url = new URL(`/pay/${statement.id}`, origin);
  url.searchParams.set("token", statement.public_token);

  return url.toString();
}

async function fetchLineItems(
  supabase: SupabaseClient<Database>,
  statementIds: string[]
) {
  if (statementIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("statement_line_items")
    .select("*")
    .in("statement_id", statementIds);

  if (error) {
    if (isMissingSchemaFeatureError(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return (data ?? []) as StatementLineItemRow[];
}

async function buildStatementSummaries(
  supabase: SupabaseClient<Database>,
  statements: StatementRow[],
  orgId: string,
  origin?: string | null
) {
  const [patientsResult, claimsResult, lineItems] = await Promise.all([
    supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("org_id", orgId),
    supabase.from("claims").select("id, total_amount").eq("org_id", orgId),
    fetchLineItems(
      supabase,
      statements.map((statement) => statement.id)
    ),
  ]);

  if (patientsResult.error || claimsResult.error) {
    throw new Error("Unable to load statement relationships.");
  }

  const patientMap = new Map(
    ((patientsResult.data ?? []) as PatientLookup[]).map((patient) => [
      patient.id,
      formatPatientName(patient),
    ])
  );
  const claimMap = new Map(
    ((claimsResult.data ?? []) as Pick<ClaimRow, "id" | "total_amount">[]).map((claim) => [
      claim.id,
      claim.total_amount,
    ])
  );
  const lineItemMap = new Map<string, StatementLineItemRow[]>();

  for (const item of lineItems) {
    const existing = lineItemMap.get(item.statement_id) ?? [];
    existing.push(item);
    lineItemMap.set(item.statement_id, existing);
  }

  return statements.map((statement) => ({
    ...statement,
    patient_name: patientMap.get(statement.patient_id) ?? "Unknown patient",
    claim_amount: statement.claim_id ? claimMap.get(statement.claim_id) ?? 0 : 0,
    public_url: origin ? getPublicStatementUrl(origin, statement) : null,
    line_items: lineItemMap.get(statement.id) ?? [],
  }));
}

async function getClaimBalanceData(
  supabase: SupabaseClient<Database>,
  orgId: string,
  claimId: string
) {
  const [claimResult, adjustmentsResult, paymentsResult] = await Promise.all([
    supabase
      .from("claims")
      .select("*")
      .eq("id", claimId)
      .eq("org_id", orgId)
      .maybeSingle(),
    supabase
      .from("adjustments")
      .select("*")
      .eq("claim_id", claimId)
      .eq("org_id", orgId),
    supabase
      .from("payments")
      .select("*")
      .eq("claim_id", claimId)
      .eq("org_id", orgId)
      .eq("status", "succeeded"),
  ]);

  if (claimResult.error || !claimResult.data) {
    throw new Error("Claim not found for statement generation.");
  }

  if (adjustmentsResult.error || paymentsResult.error) {
    throw new Error("Unable to calculate statement balance.");
  }

  const claim = claimResult.data as ClaimRow;
  const adjustments = (adjustmentsResult.data ?? []) as AdjustmentRow[];
  const payments = (paymentsResult.data ?? []) as PaymentRow[];

  const insuranceAdjustment = adjustments.reduce((sum, adjustment) => sum + adjustment.amount, 0);
  const patientResponsibility = Math.max(0, claim.total_amount - insuranceAdjustment);
  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = Math.max(0, Number((patientResponsibility - paidAmount).toFixed(2)));

  return {
    claim,
    insuranceAdjustment,
    patientResponsibility,
    paidAmount,
    balance,
  };
}

export async function listStatements(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  origin?: string | null
) {
  const { data, error } = await supabase
    .from("statements")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingSchemaFeatureError(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return buildStatementSummaries(
    supabase,
    (data ?? []) as StatementRow[],
    profile.org_id,
    origin
  );
}

export async function markStatementSent(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  id: string
) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("statements")
    .update({
      status: "sent",
      sent_at: now,
      last_sent_at: now,
    })
    .eq("id", id)
    .eq("org_id", profile.org_id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as StatementRow;
}

export async function ensureStatementForClaim(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  claimId: string
) {
  const balanceData = await getClaimBalanceData(supabase, profile.org_id, claimId);
  const { claim, insuranceAdjustment, patientResponsibility, paidAmount, balance } =
    balanceData;

  const { data: existingStatement, error: existingError } = await supabase
    .from("statements")
    .select("*")
    .eq("org_id", profile.org_id)
    .eq("claim_id", claim.id)
    .in("status", ["open", "sent"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const typedExistingStatement = (existingStatement ?? null) as StatementRow | null;

  if (balance <= 0) {
    if (typedExistingStatement) {
      await supabase
        .from("statements")
        .update({
          amount_due: 0,
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", typedExistingStatement.id)
        .eq("org_id", profile.org_id);
    }

    return null;
  }

  const token = typedExistingStatement?.public_token ?? getPublicToken();
  const statementPayload: Database["public"]["Tables"]["statements"]["Insert"] = {
    org_id: profile.org_id,
    location_id: claim.location_id,
    patient_id: claim.patient_id,
    claim_id: claim.id,
    amount_due: balance,
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      .toISOString()
      .slice(0, 10),
    delivery_method: "portal",
    public_token: token,
    token_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
    status: typedExistingStatement?.status === "sent" ? "sent" : "open",
    sent_at: typedExistingStatement?.sent_at ?? null,
    last_sent_at: typedExistingStatement?.last_sent_at ?? null,
  };

  let statement: StatementRow;

  if (typedExistingStatement) {
    const { data, error } = await supabase
      .from("statements")
      .update(statementPayload)
      .eq("id", typedExistingStatement.id)
      .eq("org_id", profile.org_id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    statement = data as StatementRow;
  } else {
    const { data, error } = await supabase
      .from("statements")
      .insert(statementPayload)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    statement = data as StatementRow;
  }

  await supabase
    .from("statement_line_items")
    .delete()
    .eq("statement_id", statement.id)
    .eq("org_id", profile.org_id);

  const lineItems: Database["public"]["Tables"]["statement_line_items"]["Insert"][] = [
    {
      org_id: profile.org_id,
      statement_id: statement.id,
      claim_id: claim.id,
      kind: "charge",
      label: "Charges",
      amount: claim.total_amount,
    },
    {
      org_id: profile.org_id,
      statement_id: statement.id,
      claim_id: claim.id,
      kind: "insurance_adjustment",
      label: "Insurance adjustment",
      amount: insuranceAdjustment * -1,
    },
    {
      org_id: profile.org_id,
      statement_id: statement.id,
      claim_id: claim.id,
      kind: "patient_responsibility",
      label: "Patient responsibility",
      amount: patientResponsibility,
    },
  ];

  if (paidAmount > 0) {
    lineItems.push({
      org_id: profile.org_id,
      statement_id: statement.id,
      claim_id: claim.id,
      kind: "payment",
      label: "Payments received",
      amount: paidAmount * -1,
    });
  }

  const { error: lineItemError } = await supabase
    .from("statement_line_items")
    .insert(lineItems);

  if (lineItemError) {
    throw new Error(lineItemError.message);
  }

  return statement;
}

export async function getPublicStatementByToken(
  supabase: SupabaseClient<Database>,
  statementId: string,
  token: string,
  origin?: string | null
): Promise<PublicStatementView> {
  const { data, error } = await supabase
    .from("statements")
    .select("*")
    .eq("id", statementId)
    .eq("public_token", token)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Statement not found.");
  }

  const statement = data as StatementRow;

  if (statement.token_expires_at && statement.token_expires_at < new Date().toISOString()) {
    throw new Error("This statement link has expired.");
  }

  const [summary] = await buildStatementSummaries(
    supabase,
    [statement],
    statement.org_id,
    origin
  );

  return {
    statement: summary,
  };
}

export async function createStatementCheckoutSession(
  supabase: SupabaseClient<Database>,
  statement: StatementRow,
  patientName: string,
  origin: string
) {
  const stripe = createStripeServerClient();
  const token = statement.public_token ?? getPublicToken();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: new URL(
      `/pay/${statement.id}/return?session_id={CHECKOUT_SESSION_ID}&token=${token}`,
      origin
    ).toString(),
    cancel_url: new URL(`/pay/${statement.id}?token=${token}`, origin).toString(),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(statement.amount_due * 100),
          product_data: {
            name: `Statement ${statement.id.slice(0, 8)}`,
            description: `Patient: ${patientName}`,
          },
        },
      },
    ],
    metadata: {
      statement_id: statement.id,
      claim_id: statement.claim_id ?? "",
      patient_id: statement.patient_id,
      org_id: statement.org_id,
      location_id: statement.location_id ?? "",
    },
  });

  const { data, error } = await supabase
    .from("statements")
    .update({
      public_token: token,
      stripe_checkout_url: session.url,
    })
    .eq("id", statement.id)
    .eq("org_id", statement.org_id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as StatementRow;
}

export async function syncStatementPaymentFromSession(
  supabase: SupabaseClient<Database>,
  sessionId: string
) {
  const stripe = createStripeServerClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    throw new Error("The Stripe payment session is not paid.");
  }

  const statementId = session.metadata?.statement_id ?? null;

  if (!statementId) {
    throw new Error("The Stripe payment session is missing statement metadata.");
  }

  const { data: statement, error: statementError } = await supabase
    .from("statements")
    .select("*")
    .eq("id", statementId)
    .maybeSingle();

  if (statementError || !statement) {
    throw new Error("Statement not found.");
  }

  const typedStatement = statement as StatementRow;

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("*")
    .eq("stripe_id", session.id)
    .maybeSingle();

  if (!existingPayment) {
    const { error: paymentError } = await supabase.from("payments").insert({
      org_id: typedStatement.org_id,
      location_id: typedStatement.location_id,
      claim_id: typedStatement.claim_id,
      patient_id: typedStatement.patient_id,
      amount: typedStatement.amount_due,
      method: "card",
      stripe_id: session.id,
      status: "succeeded",
      received_at: new Date().toISOString(),
    });

    if (paymentError) {
      throw new Error(paymentError.message);
    }
  }

  const { data: updatedStatement, error: updateError } = await supabase
    .from("statements")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      amount_due: 0,
    })
    .eq("id", typedStatement.id)
    .eq("org_id", typedStatement.org_id)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (typedStatement.claim_id) {
    await supabase
      .from("claims")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", typedStatement.claim_id)
      .eq("org_id", typedStatement.org_id);
  }

  return updatedStatement as StatementRow;
}
