import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeDollarSign, ReceiptText, UserRound } from "lucide-react";

import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/components/system/card";
import { PageShell } from "@/components/system/page-shell";
import { DummyPaymentActions } from "@/components/dummy-payment-actions";

type DemoPaymentPageProps = {
  params: Promise<{
    paymentId: string;
  }>;
  searchParams?: Promise<{
    amount?: string;
    description?: string;
    patient?: string;
  }>;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default async function DemoPaymentPage({
  params,
  searchParams,
}: DemoPaymentPageProps) {
  const { paymentId } = await params;
  const query = searchParams ? await searchParams : undefined;
  const amount = Number(query?.amount ?? 0);
  const description = query?.description ?? "Patient payment";
  const patient = query?.patient ?? "Patient";

  return (
    <PageShell tone="checkout" containerClassName="max-w-5xl">
      <div className="space-y-6">
        <AppCard className="overflow-hidden border-border/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(25,52,102,0.92))] text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.16),transparent_35%)]" />
          <AppCardHeader className="relative space-y-3 px-6 py-6 sm:px-8 sm:py-8">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-cyan-200/88">
              Internal Demo Checkout
            </p>
            <AppCardTitle className="text-3xl text-white sm:text-4xl">
              Demo payment checkout
            </AppCardTitle>
            <AppCardDescription className="max-w-3xl text-base leading-7 text-white/72">
              Use this hackathon-safe payment page to simulate a successful or cancelled patient payment without any external gateway.
            </AppCardDescription>
          </AppCardHeader>
        </AppCard>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.92fr]">
          <AppCard className="border-border/70 bg-white/82">
            <AppCardHeader className="border-b border-border/60 px-6 py-5">
              <AppCardTitle className="text-xl">Payment summary</AppCardTitle>
              <AppCardDescription>
                Confirm the details below before simulating an outcome.
              </AppCardDescription>
            </AppCardHeader>
            <AppCardContent className="space-y-4 px-6 py-6 text-sm text-foreground">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-border/70 bg-muted/35 p-4">
                  <div className="flex items-center gap-2 text-sky-700">
                    <UserRound className="size-4" />
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Patient
                    </p>
                  </div>
                  <p className="mt-2 font-heading text-xl font-semibold text-foreground">
                    {patient}
                  </p>
                </div>
                <div className="rounded-[24px] border border-border/70 bg-muted/35 p-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <BadgeDollarSign className="size-4" />
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Amount
                    </p>
                  </div>
                  <p className="mt-2 font-heading text-xl font-semibold text-foreground">
                    {formatCurrency(Number.isFinite(amount) ? amount : 0)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-border/70 bg-muted/35 p-4 md:col-span-2">
                  <div className="flex items-center gap-2 text-amber-700">
                    <ReceiptText className="size-4" />
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Description
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-foreground">{description}</p>
                </div>
                <div className="rounded-[24px] border border-border/70 bg-muted/35 p-4 md:col-span-2">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Payment ID
                  </p>
                  <p className="mt-2 break-all font-mono text-xs text-foreground">
                    {paymentId}
                  </p>
                </div>
              </div>
            </AppCardContent>
          </AppCard>

          <AppCard className="border-border/70 bg-white/82">
            <AppCardHeader className="border-b border-border/60 px-6 py-5">
              <AppCardTitle className="text-xl">Simulate outcome</AppCardTitle>
              <AppCardDescription>
                Choose the result that should be pushed back into the workspace payment queue.
              </AppCardDescription>
            </AppCardHeader>
            <AppCardContent className="space-y-5 px-6 py-6">
              <Suspense fallback={null}>
                <DummyPaymentActions paymentId={paymentId} />
              </Suspense>

              <div className="rounded-[22px] border border-dashed border-border/80 bg-muted/35 px-4 py-4 text-sm leading-6 text-muted-foreground">
                This page expects to be opened from a logged-in MedFlow Pro session so it can update the payment record through the internal API.
              </div>

              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 underline underline-offset-4"
                href="/?tab=payments"
              >
                <ArrowLeft className="size-4" />
                Back to payments workspace
              </Link>
            </AppCardContent>
          </AppCard>
        </div>
      </div>
    </PageShell>
  );
}
