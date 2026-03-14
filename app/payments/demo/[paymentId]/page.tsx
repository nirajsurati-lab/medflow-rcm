import { Suspense } from "react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf0_0%,#f7fbff_100%)] px-6 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border-white/80 bg-white/90 shadow-lg shadow-slate-200/70 backdrop-blur">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl text-slate-950">
              Demo payment checkout
            </CardTitle>
            <CardDescription className="leading-6">
              This is a hackathon-safe dummy payment page. Use it to simulate a
              successful or cancelled payment without any external gateway.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="font-medium text-slate-950">Patient</p>
                <p>{patient}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="font-medium text-slate-950">Amount</p>
                <p>{formatCurrency(Number.isFinite(amount) ? amount : 0)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
                <p className="font-medium text-slate-950">Description</p>
                <p>{description}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
                <p className="font-medium text-slate-950">Payment ID</p>
                <p className="break-all font-mono text-xs text-slate-600">
                  {paymentId}
                </p>
              </div>
            </div>

            <Suspense fallback={null}>
              <DummyPaymentActions paymentId={paymentId} />
            </Suspense>

            <p className="text-xs text-slate-500">
              This page expects to be opened from a logged-in MedFlow Pro session
              so it can update the payment record through the internal API.
            </p>

            <Link className="text-sm text-sky-700 underline underline-offset-4" href="/?tab=payments">
              Back to payments workspace
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
