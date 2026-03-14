"use client";

import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/components/system/card";
import { ResponsiveRecords } from "@/components/system/responsive-records";
import { Section } from "@/components/system/section";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/workspace/shared/empty-state";
import type { WorkspaceController } from "@/components/workspace/types";
import { formatDateTime } from "@/components/workspace/workspace-utils";
import { cn } from "@/lib/utils";
import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

type AuditSectionProps = {
  controller: WorkspaceController;
  data: PhaseTwoWorkspaceData;
};

export function AuditSection({
  controller,
  data,
}: AuditSectionProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
      <Section
        eyebrow="Admin Visibility"
        title="Audit log"
        description="Select an activity record to inspect the actor, changed fields, and before/after payloads."
      >
        <ResponsiveRecords
          columns={[
            { key: "time", label: "Time" },
            { key: "actor", label: "Actor" },
            { key: "action", label: "Action" },
            { key: "table", label: "Table" },
            { key: "summary", label: "Summary" },
          ]}
          rows={data.audit_logs}
          getRowKey={(log) => log.id}
          renderTableRow={(log) => (
            <TableRow
              key={log.id}
              className={cn(
                "cursor-pointer",
                controller.audit.selectedLog?.id === log.id
                  ? "bg-secondary/55"
                  : undefined
              )}
              onClick={() => controller.audit.setSelectedId(log.id)}
            >
              <TableCell>{formatDateTime(log.created_at)}</TableCell>
              <TableCell className="max-w-xs truncate">{log.actor_name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="rounded-full">
                  {log.action}
                </Badge>
              </TableCell>
              <TableCell>{log.table_name}</TableCell>
              <TableCell className="max-w-sm truncate">{log.summary}</TableCell>
            </TableRow>
          )}
          renderMobileCard={(log) => {
            const isSelected = controller.audit.selectedLog?.id === log.id;

            return (
              <button
                type="button"
                onClick={() => controller.audit.setSelectedId(log.id)}
                className="w-full text-left"
              >
                <AppCard
                  className={cn(
                    "border-border/70 bg-white/70 shadow-sm transition-colors",
                    isSelected ? "border-sky-200 bg-secondary/55" : undefined
                  )}
                >
                  <AppCardHeader className="px-5 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <AppCardTitle className="text-lg">{log.table_name}</AppCardTitle>
                        <AppCardDescription>
                          {formatDateTime(log.created_at)}
                        </AppCardDescription>
                      </div>
                      <Badge variant="outline" className="rounded-full">
                        {log.action}
                      </Badge>
                    </div>
                  </AppCardHeader>
                  <AppCardContent className="space-y-3 px-5 pb-5">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Actor
                      </p>
                      <p className="mt-1 text-sm text-foreground">{log.actor_name}</p>
                    </div>
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Summary
                      </p>
                      <p className="mt-1 text-sm leading-6 text-foreground">
                        {log.summary}
                      </p>
                    </div>
                  </AppCardContent>
                </AppCard>
              </button>
            );
          }}
          emptyMessage="No audit logs available yet."
          emptyDetail="Audit events will appear here once records are created, updated, or deleted in the workspace."
        />
      </Section>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <Section
          eyebrow="Selected Event"
          title="Audit detail"
          description="Review the selected row and its before/after payloads."
        >
          {controller.audit.selectedLog ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[24px] border border-border/70 bg-white/70 p-4">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Actor
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {controller.audit.selectedLog.actor_name}
                  </p>
                </div>
                <div className="rounded-[24px] border border-border/70 bg-white/70 p-4">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Record
                  </p>
                  <p className="mt-2 break-all font-mono text-xs text-foreground">
                    {controller.audit.selectedLog.record_id}
                  </p>
                </div>
                <div className="rounded-[24px] border border-border/70 bg-white/70 p-4">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Operation
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {controller.audit.selectedLog.action} on{" "}
                    {controller.audit.selectedLog.table_name}
                  </p>
                </div>
                <div className="rounded-[24px] border border-border/70 bg-white/70 p-4">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Changed fields
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {controller.audit.selectedLog.changed_fields.length > 0
                      ? controller.audit.selectedLog.changed_fields.join(", ")
                      : "No top-level field diff captured"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-heading text-lg font-semibold text-foreground">Old data</p>
                <Textarea
                  id="audit-old-data"
                  readOnly
                  rows={10}
                  value={
                    controller.audit.selectedLog.old_data
                      ? JSON.stringify(controller.audit.selectedLog.old_data, null, 2)
                      : "null"
                  }
                />
              </div>

              <div className="space-y-2">
                <p className="font-heading text-lg font-semibold text-foreground">New data</p>
                <Textarea
                  id="audit-new-data"
                  readOnly
                  rows={10}
                  value={
                    controller.audit.selectedLog.new_data
                      ? JSON.stringify(controller.audit.selectedLog.new_data, null, 2)
                      : "null"
                  }
                />
              </div>
            </div>
          ) : (
            <EmptyState
              message="Select an audit row to inspect its details."
              detail="Once you choose a log entry, its payload diff and actor details will appear here."
            />
          )}
        </Section>
      </div>
    </div>
  );
}
