"use client";

import { DataTable } from "@/components/system/data-table";
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
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Section
        title="Audit log"
        description="Admin-only activity history captured by database audit triggers."
      >
        <DataTable
          columns={[
            { key: "time", label: "Time" },
            { key: "actor", label: "Actor" },
            { key: "action", label: "Action" },
            { key: "table", label: "Table" },
            { key: "summary", label: "Summary" },
          ]}
          rows={data.audit_logs}
          getRowKey={(log) => log.id}
          renderRow={(log) => (
            <TableRow
              key={log.id}
              className={cn(
                "cursor-pointer",
                controller.audit.selectedLog?.id === log.id ? "bg-slate-50" : undefined
              )}
              onClick={() => controller.audit.setSelectedId(log.id)}
            >
              <TableCell>{formatDateTime(log.created_at)}</TableCell>
              <TableCell className="max-w-xs truncate">{log.actor_name}</TableCell>
              <TableCell>
                <Badge variant="outline">{log.action}</Badge>
              </TableCell>
              <TableCell>{log.table_name}</TableCell>
              <TableCell className="max-w-sm truncate">{log.summary}</TableCell>
            </TableRow>
          )}
          emptyMessage="No audit logs available yet."
        />
      </Section>

      <Section
        title="Audit detail"
        description="Review the selected row and its before/after payloads."
      >
        {controller.audit.selectedLog ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Actor</p>
                <p className="mt-1 font-medium text-slate-950">
                  {controller.audit.selectedLog.actor_name}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Record</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-700">
                  {controller.audit.selectedLog.record_id}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Operation</p>
                <p className="mt-1 font-medium text-slate-950">
                  {controller.audit.selectedLog.action} on{" "}
                  {controller.audit.selectedLog.table_name}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Changed fields</p>
                <p className="mt-1 text-slate-950">
                  {controller.audit.selectedLog.changed_fields.length > 0
                    ? controller.audit.selectedLog.changed_fields.join(", ")
                    : "No top-level field diff captured"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-950">Old data</p>
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
              <p className="text-sm font-medium text-slate-950">New data</p>
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
  );
}
