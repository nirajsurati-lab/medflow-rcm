import { notFound } from "next/navigation";
import { BadgeDollarSign, FileText, ReceiptText, ShieldCheck } from "lucide-react";

import { PublicStatementActions } from "@/components/public-statement-actions";
import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/components/system/card";
import { PageShell } from "@/components/system/page-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getPublicStatementByToken } from "@/lib/services/statements";
import { formatCurrency, formatDate } from "@/components/workspace/workspace-utils";

type StatementPageProps = {
  params: Promise<{
    statementId: string;
  }>;
  searchParams?: Promise<{
    token?: string;
    status?: string;
  }>;
};

export default async function PublicStatementPage({
  params,
  searchParams,
}: StatementPageProps) {
  const supabase = createAdminSupabaseClient();
  const { statementId } = await params;
  const query = searchParams ? await searchParams : undefined;
  const token = query?.token ?? "";

  if (!supabase || !token) {
    notFound();
  }

  let publicView;

  try {
    publicView = await getPublicStatementByToken(
      supabase,
      statementId,
      token,
      process.env.NEXT_PUBLIC_SITE_URL ?? undefined
    );
  } catch {
    notFound();
  }

  const statement = publicView.statement;
  const isPaid = statement.status === "paid" || statement.amount_due <= 0;

  return (
    <PageShell tone="checkout" containerClassName="max-w-5xl">
      <div className="space-y-6">
        {query?.status === "paid" ? (
          <Alert>
            <ShieldCheck className="size-4" />
            <AlertTitle>Payment received</AlertTitle>
            <AlertDescription>
              Thank you. This statement has been paid and the MedFlow Pro workspace has been updated.
            </AlertDescription>
          </Alert>
        ) : null}

        {query?.status === "error" ? (
          <Alert variant="destructive">
            <AlertTitle>Payment verification failed</AlertTitle>
            <AlertDescription>
              The checkout session could not be confirmed. Please try again from this statement link.
            </AlertDescription>
          </Alert>
        ) : null}

        <AppCard className="overflow-hidden border-border/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(16,74,132,0.92))] text-white">
          <AppCardHeader className="space-y-3 px-6 py-6 sm:px-8 sm:py-8">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-cyan-200/88">
              Patient Statement
            </p>
            <AppCardTitle className="text-3xl text-white sm:text-4xl">
              MedFlow Pro billing statement
            </AppCardTitle>
            <AppCardDescription className="max-w-3xl text-base leading-7 text-white/72">
              Review the itemized balance below, then continue to Stripe Checkout when you are ready to pay.
            </AppCardDescription>
          </AppCardHeader>
        </AppCard>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <AppCard className="border-border/70 bg-white/82">
            <AppCardHeader className="border-b border-border/60 px-6 py-5">
              <AppCardTitle className="text-xl">Statement summary</AppCardTitle>
              <AppCardDescription>
                Statement ID {statement.id.slice(0, 8)} for {statement.patient_name}
              </AppCardDescription>
            </AppCardHeader>
            <AppCardContent className="space-y-4 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-border/70 bg-muted/35 p-4">
                  <div className="flex items-center gap-2 text-sky-700">
                    <BadgeDollarSign className="size-4" />
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Amount due
                    </p>
                  </div>
                  <p className="mt-2 font-heading text-2xl font-semibold text-foreground">
                    {formatCurrency(statement.amount_due)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-border/70 bg-muted/35 p-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <FileText className="size-4" />
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Due date
                    </p>
                  </div>
                  <p className="mt-2 font-heading text-2xl font-semibold text-foreground">
                    {formatDate(statement.due_date)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {statement.line_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-[20px] border border-border/70 bg-white/75 px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-2 text-foreground">
                      <ReceiptText className="size-4 text-sky-700" />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </AppCardContent>
          </AppCard>

          <AppCard className="border-border/70 bg-white/82">
            <AppCardHeader className="border-b border-border/60 px-6 py-5">
              <AppCardTitle className="text-xl">Payment options</AppCardTitle>
              <AppCardDescription>
                Continue to Stripe Checkout to pay the remaining patient balance securely.
              </AppCardDescription>
            </AppCardHeader>
            <AppCardContent className="space-y-5 px-6 py-6">
              <div className="rounded-[22px] border border-dashed border-border/80 bg-muted/35 px-4 py-4 text-sm leading-6 text-muted-foreground">
                This secure payment link is tied to this statement and expires automatically.
              </div>

              <PublicStatementActions
                statementId={statement.id}
                token={token}
                isPaid={isPaid}
              />
            </AppCardContent>
          </AppCard>
        </div>
      </div>
    </PageShell>
  );
}
