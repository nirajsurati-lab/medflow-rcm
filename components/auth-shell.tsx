import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  Building2,
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthShellProps = {
  eyebrow: string;
  heading: string;
  description: string;
  cardTitle: string;
  cardDescription: string;
  alternateHref: string;
  alternateLabel: string;
  alternateText: string;
  children: ReactNode;
};

type HighlightCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

function HighlightCard({ title, description, icon }: HighlightCardProps) {
  return (
    <Card className="border-white/70 bg-white/72 shadow-sm backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function AuthShell({
  eyebrow,
  heading,
  description,
  cardTitle,
  cardDescription,
  alternateHref,
  alternateLabel,
  alternateText,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff8f0_0%,transparent_35%),radial-gradient(circle_at_top_right,#dfe9ff_0%,transparent_30%),linear-gradient(145deg,#f6fbfa_0%,#f7fbff_50%,#fff8ef_100%)] px-6 py-10 text-foreground sm:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm backdrop-blur">
            <HeartPulse className="size-4" />
            MedFlow Pro
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              {eyebrow}
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {heading}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              {description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <HighlightCard
              title="Tenant safe"
              description="Org-aware data access with Supabase-backed staff profiles."
              icon={<ShieldCheck className="size-4 text-emerald-700" />}
            />
            <HighlightCard
              title="Manual workflows"
              description="Built for hackathon-safe billing ops without external eligibility or EDI."
              icon={<LockKeyhole className="size-4 text-sky-700" />}
            />
            <HighlightCard
              title="Fast bootstrap"
              description="Create the first org admin or sign back into an existing workspace."
              icon={<Building2 className="size-4 text-amber-700" />}
            />
            <HighlightCard
              title="Phase 4 ready"
              description="Patients, claims, payments, denials, dashboards, and audit visibility."
              icon={<Activity className="size-4 text-rose-700" />}
            />
          </div>
        </section>

        <Card className="border-white/80 bg-white/88 shadow-xl shadow-slate-200/70 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-slate-950">{cardTitle}</CardTitle>
            <CardDescription className="leading-6">
              {cardDescription}
            </CardDescription>
          </CardHeader>
          <div className="space-y-5 px-6 pb-6">
            {children}
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              {alternateText}{" "}
              <Link
                href={alternateHref}
                className="font-medium text-sky-700 underline underline-offset-4"
              >
                {alternateLabel}
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
