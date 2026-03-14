"use client";

import { ARAgingChart } from "@/components/ar-aging-chart";
import { Section } from "@/components/system/section";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/system/data-table";
import { EmptyState } from "@/components/workspace/shared/empty-state";
import { StatusBadge } from "@/components/workspace/shared/status-badge";
import type { WorkspaceController } from "@/components/workspace/types";
import {
  formatCurrency,
  formatStatusLabel,
} from "@/components/workspace/workspace-utils";
import { TableCell, TableRow } from "@/components/ui/table";
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
        title="Quick navigation"
        description="Jump straight into the major Phase 4 workflows."
        contentClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-5"
      >
        {controller.dashboard.quickNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <Button
              key={item.tab}
              type="button"
              variant="outline"
              className="h-auto justify-start rounded-2xl border-slate-200/80 px-4 py-4 text-left"
              onClick={() => controller.actions.setActiveTab(item.tab)}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                  <Icon className="size-4" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-slate-950">{item.title}</p>
                  <p className="text-xs leading-5 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            </Button>
          );
        })}
      </Section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Section
          title="Revenue command center"
          description={`Phase 4 dashboard for ${organizationName} with manual-entry claim operations, audit visibility, billing follow-up, and demo payment tracking.`}
          contentClassName="grid gap-4 md:grid-cols-3"
        >
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Role</p>
            <p className="mt-1 font-medium text-slate-950">
              {formatStatusLabel(userRole)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Patients</p>
            <p className="mt-1 font-medium text-slate-950">
              {data.patients.length} active records
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Open denials</p>
            <p className="mt-1 font-medium text-slate-950">
              {
                data.denials.filter((denial) => denial.status === "open").length
              }{" "}
              in follow-up
            </p>
          </div>
        </Section>

        <Section
          title="Queue focus"
          description="Oldest unpaid claims that likely need follow-up next."
        >
          {controller.dashboard.queuePreview.length > 0 ? (
            <div className="space-y-3">
              {controller.dashboard.queuePreview.map((claim) => (
                <div
                  key={claim.id}
                  className="rounded-2xl border border-slate-200/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">
                        {claim.patient_name}
                      </p>
                      <p className="text-sm text-slate-600">{claim.payer_name}</p>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                    <span>{claim.days_open} days open</span>
                    <span>{formatCurrency(claim.outstanding_amount)}</span>
                    <span>{claim.recommended_action}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              message="No outstanding claims yet."
              detail="As claims move through submission, this panel will surface follow-up priorities."
            />
          )}
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ARAgingChart data={data.dashboard.aging_buckets} />

        <Section
          title="Aging buckets"
          description="Bucket totals behind the chart for quick review."
        >
          <div className="space-y-3">
            {data.dashboard.aging_buckets.map((bucket) => (
              <div
                key={bucket.label}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-950">{bucket.label} days</p>
                  <p className="text-sm text-slate-600">
                    {bucket.claim_count} claims
                  </p>
                </div>
                <p className="font-semibold text-slate-950">
                  {formatCurrency(bucket.amount)}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section
        title="Claims queue"
        description="Aging-aware queue for unpaid claims that still need action."
      >
        <DataTable
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
          renderRow={(claim) => (
            <TableRow key={claim.id}>
              <TableCell className="font-medium text-slate-950">
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
          emptyMessage="No unpaid claims in the queue yet."
        />
      </Section>
    </>
  );
}
