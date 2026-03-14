"use client";

import { ExternalLink, Send } from "lucide-react";

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
import { StatusBadge } from "@/components/workspace/shared/status-badge";
import type { WorkspaceController } from "@/components/workspace/types";
import { formatCurrency, formatDate, formatDateTime } from "@/components/workspace/workspace-utils";
import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

type StatementsSectionProps = {
  controller: WorkspaceController;
  data: PhaseTwoWorkspaceData;
};

export function StatementsSection({
  controller,
  data,
}: StatementsSectionProps) {
  const selectedStatement = controller.statements.selectedStatement;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <Section
        eyebrow="Patient Billing"
        title="Statement queue"
        description="Open statements, send tracking, and secure public payment links."
      >
        <ResponsiveRecords
          columns={[
            { key: "patient", label: "Patient" },
            { key: "due", label: "Due" },
            { key: "status", label: "Status" },
            { key: "sent", label: "Sent" },
          ]}
          rows={data.statements}
          getRowKey={(statement) => statement.id}
          renderTableRow={(statement) => (
            <TableRow
              key={statement.id}
              className="cursor-pointer"
              onClick={() => controller.statements.setSelectedId(statement.id)}
            >
              <TableCell className="font-medium text-foreground">
                {statement.patient_name}
              </TableCell>
              <TableCell>{formatCurrency(statement.amount_due)}</TableCell>
              <TableCell>
                <StatusBadge status={statement.status} />
              </TableCell>
              <TableCell>{formatDateTime(statement.last_sent_at ?? statement.sent_at)}</TableCell>
            </TableRow>
          )}
          renderMobileCard={(statement) => (
            <AppCard
              className="cursor-pointer border-border/70 bg-white/70 shadow-sm"
              onClick={() => controller.statements.setSelectedId(statement.id)}
            >
              <AppCardHeader className="px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <AppCardTitle className="text-lg">{statement.patient_name}</AppCardTitle>
                    <AppCardDescription>{formatDate(statement.due_date)}</AppCardDescription>
                  </div>
                  <StatusBadge status={statement.status} />
                </div>
              </AppCardHeader>
              <AppCardContent className="px-5 pb-5">
                <p className="font-medium text-foreground">
                  {formatCurrency(statement.amount_due)}
                </p>
              </AppCardContent>
            </AppCard>
          )}
          emptyMessage="No statements generated yet."
          emptyDetail="Statements are created automatically when a patient balance remains after payment posting."
        />
      </Section>

      <AppCard className="border-border/70 bg-white/82">
        <AppCardHeader className="border-b border-border/60 px-6 py-5">
          <AppCardTitle className="text-xl">Statement detail</AppCardTitle>
          <AppCardDescription>
            Review the itemized balance and send status for the selected statement.
          </AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-4 px-6 py-6">
          {selectedStatement ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{selectedStatement.patient_name}</p>
                  <p className="font-heading text-2xl font-semibold text-foreground">
                    {formatCurrency(selectedStatement.amount_due)}
                  </p>
                </div>
                <StatusBadge status={selectedStatement.status} />
              </div>

              <div className="space-y-3">
                {selectedStatement.line_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-[20px] border border-border/70 bg-white/75 px-4 py-3 text-sm"
                  >
                    <span>{item.label}</span>
                    <span className="font-semibold">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-2">
                <Button
                  type="button"
                  onClick={() => controller.statements.sendStatement(selectedStatement)}
                >
                  <Send className="size-4" />
                  Mark as sent
                </Button>
                {selectedStatement.public_url ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      window.open(selectedStatement.public_url ?? "", "_blank", "noopener,noreferrer")
                    }
                  >
                    <ExternalLink className="size-4" />
                    Open public pay link
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a statement to view its itemized balance.
            </p>
          )}
        </AppCardContent>
      </AppCard>
    </div>
  );
}
