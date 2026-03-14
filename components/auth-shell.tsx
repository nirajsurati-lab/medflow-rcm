import type { ReactNode } from "react";
import Link from "next/link";
import {
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { PageShell } from "@/components/system/page-shell";
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
    <Card className="border-white/15 bg-white/8 text-white shadow-none backdrop-blur-sm">
      <CardHeader className="space-y-2 px-5 py-5">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          {icon}
          {title}
        </CardTitle>
        <CardDescription className="text-white/70">{description}</CardDescription>
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
    <PageShell
      tone="auth"
      className="px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5"
      containerClassName="max-w-none"
    >
      <div className="grid min-h-[calc(100vh-1.5rem)] items-center gap-6 xl:grid-cols-[minmax(0,1.06fr)_minmax(520px,0.8fr)]">
        <section className="relative overflow-hidden rounded-[32px] border border-slate-950/8 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(22,44,92,0.92))] px-6 py-6 text-white shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)] sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_30%)]" />
          <div className="relative flex h-full flex-col justify-center gap-10">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-white/88 backdrop-blur">
                <HeartPulse className="size-4" />
                MedFlow Pro
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/88">
                  {eyebrow}
                </p>
                <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  {heading}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                  {description}
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <HighlightCard
                  title="Tenant safe"
                  description="Org-aware data access with Supabase-backed staff profiles and role checks."
                  icon={<ShieldCheck className="size-4 text-cyan-300" />}
                />
                <HighlightCard
                  title="Manual workflows"
                  description="Built for hackathon-safe billing ops without external eligibility or EDI dependencies."
                  icon={<LockKeyhole className="size-4 text-emerald-300" />}
                />
              </div>
            </div>
          </div>
        </section>

        <Card className="border-white/70 bg-white/90 shadow-[0_36px_100px_-48px_rgba(15,23,42,0.45)] xl:self-center">
          <CardHeader className="space-y-3 border-b border-border/60 px-6 py-6 sm:px-8">
            <CardTitle className="font-heading text-3xl text-foreground">
              {cardTitle}
            </CardTitle>
            <CardDescription className="max-w-xl text-base leading-7">
              {cardDescription}
            </CardDescription>
          </CardHeader>
          <div className="space-y-6 px-6 py-6 sm:px-8 xl:py-8">
            {children}
            <div className="rounded-[24px] border border-dashed border-border/80 bg-muted/35 px-4 py-4 text-sm leading-6 text-muted-foreground">
              {alternateText}{" "}
              <Link
                href={alternateHref}
                className="font-semibold text-sky-700 underline underline-offset-4"
              >
                {alternateLabel}
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
