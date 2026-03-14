"use client";

import {
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { ARAgingChart } from "@/components/ar-aging-chart";
import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/components/system/card";
import { ResponsiveRecords } from "@/components/system/responsive-records";
import { Section } from "@/components/system/section";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/workspace/shared/empty-state";
import { StatusBadge } from "@/components/workspace/shared/status-badge";
import type { WorkspaceController } from "@/components/workspace/types";
import {
  formatCurrency,
  formatStatusLabel,
} from "@/components/workspace/workspace-utils";
import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

type DashboardSectionProps = {
  controller: WorkspaceController;
  data: PhaseTwoWorkspaceData;
  organizationName: string;
  userRole: string;
};

export function DashboardSection({
  controller,
  data,
  organizationName,
  userRole,
}: DashboardSectionProps) {
  return (
    <>
      <Section
        eyebrow="Jump Back In"
        title="Quick actions"
        description="Open the next workflow without hunting through the workspace."
        contentClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5"
      >
        {controller.dashboard.quickNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <Button
              key={item.tab}
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start rounded-[24px] border border-border/70 bg-white/65 px-4 py-4 text-left whitespace-normal shadow-sm hover:bg-white"
              onClick={() => controller.actions.setActiveTab(item.tab)}
            >
              <div className="flex w-full min-w-0 items-start gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-sky-700 shadow-sm">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-heading text-base font-semibold leading-6 text-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs leading-5 break-words text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </Button>
          );
        })}
      </Section>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <AppCard className="relative overflow-hidden border-border/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(24,52,100,0.92))] text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.16),transparent_35%)]" />
          <AppCardHeader className="relative space-y-3 px-6 py-6">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/60">
              Revenue Command Center
            </p>
            <AppCardTitle className="text-2xl text-white">
              Manual billing operations for {organizationName}
            </AppCardTitle>
            <AppCardDescription className="max-w-2xl text-white/72">
              Keep claim intake, denial follow-up, patient payments, and audit visibility aligned inside one org-scoped workspace.
            </AppCardDescription>
          </AppCardHeader>
          <AppCardContent className="relative px-6 pb-6">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[22px] border border-white/12 bg-white/8 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-2 text-white/70">
                  <ShieldCheck className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                    Active role
                  </p>
                </div>
                <p className="mt-3 font-heading text-xl text-white">
                  {formatStatusLabel(userRole)}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/12 bg-white/8 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-2 text-white/70">
                  <UsersRound className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                    Patients
                  </p>
                </div>
                <p className="mt-3 font-heading text-xl text-white">
                  {data.patients.length} active records
                </p>
              </div>
              <div className="rounded-[22px] border border-white/12 bg-white/8 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-2 text-white/70">
                  <Sparkles className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                    Open denials
                  </p>
                </div>
                <p className="mt-3 font-heading text-xl text-white">
                  {data.denials.filter((denial) => denial.status === "open").length} in follow-up
                </p>
              </div>
            </div>
          </AppCardContent>
        </AppCard>

        <Section
          eyebrow="Priority Queue"
          title="Queue focus"
          description="Oldest unpaid claims that likely need manual follow-up next."
        >
          {controller.dashboard.queuePreview.length > 0 ? (
            <div className="space-y-3">
              {controller.dashboard.queuePreview.map((claim) => (
                <AppCard
                  key={claim.id}
                  className="border-border/70 bg-white/65 shadow-sm"
                >
                  <AppCardContent className="space-y-4 px-5 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-heading text-lg font-semibold text-foreground">
                          {claim.patient_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {claim.payer_name}
                        </p>
                      </div>
                      <StatusBadge status={claim.status} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Age
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          {claim.days_open} days open
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Outstanding
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          {formatCurrency(claim.outstanding_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Next move
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          {claim.recommended_action}
                        </p>
                      </div>
                    </div>
                  </AppCardContent>
                </AppCard>
              ))}
            </div>
          ) : (
            <EmptyState
              message="No outstanding claims yet."
              detail="As claims move through submission, this panel will surface the next follow-up priorities."
            />
          )}
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ARAgingChart data={data.dashboard.aging_buckets} />

        <Section
          eyebrow="Bucket Detail"
          title="Aging buckets"
          description="The balances behind the chart, grouped for quick review."
        >
          <div className="space-y-3">
            {data.dashboard.aging_buckets.map((bucket) => (
              <div
                key={bucket.label}
                className="flex items-center justify-between rounded-[24px] border border-border/70 bg-white/70 px-4 py-4"
              >
                <div>
                  <p className="font-heading text-lg font-semibold text-foreground">
                    {bucket.label} days
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bucket.claim_count} claims
                  </p>
                </div>
                <p className="font-heading text-xl font-semibold text-foreground">
                  {formatCurrency(bucket.amount)}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section
        eyebrow="Operational Queue"
        title="Claims queue"
        description="Aging-aware follow-up queue for unpaid claims that still need action."
      >
        <ResponsiveRecords
          columns={[
            { key: "patient", label: "Patient" },
            { key: "payer", label: "Payer" },
            { key: "status", label: "Status" },
            { key: "age", label: "Age" },
            { key: "bucket", label: "Bucket" },
            { key: "outstanding", label: "Outstanding" },
            { key: "action", label: "Recommended action" },
          ]}
          rows={data.dashboard.claims_queue}
          getRowKey={(claim) => claim.id}
          renderTableRow={(claim) => (
            <TableRow key={claim.id}>
              <TableCell className="font-medium text-foreground">
                {claim.patient_name}
              </TableCell>
              <TableCell>{claim.payer_name}</TableCell>
              <TableCell>
                <StatusBadge status={claim.status} />
              </TableCell>
              <TableCell>{claim.days_open} days</TableCell>
              <TableCell>{claim.aging_bucket}</TableCell>
              <TableCell>{formatCurrency(claim.outstanding_amount)}</TableCell>
              <TableCell>{claim.recommended_action}</TableCell>
            </TableRow>
          )}
          renderMobileCard={(claim) => (
            <AppCard className="border-border/70 bg-white/70 shadow-sm">
              <AppCardContent className="space-y-4 px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-heading text-lg font-semibold text-foreground">
                      {claim.patient_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{claim.payer_name}</p>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Age bucket
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {claim.days_open} days · {claim.aging_bucket}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Outstanding
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {formatCurrency(claim.outstanding_amount)}
                    </p>
                  </div>
                </div>
                <div className="rounded-[22px] bg-muted/45 px-4 py-3">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Recommended action
                  </p>
                  <p className="mt-1 text-sm leading-6 text-foreground">
                    {claim.recommended_action}
                  </p>
                </div>
              </AppCardContent>
            </AppCard>
          )}
          emptyMessage="No unpaid claims in the queue yet."
          emptyDetail="As soon as claims are drafted or submitted, the queue will surface the next actions here."
        />
      </Section>
    </>
  );
}
