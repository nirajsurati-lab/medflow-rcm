"use client";

import { useState } from "react";
import { Send } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/workspace/shared/status-badge";
import type { WorkspaceController } from "@/components/workspace/types";
import { formatCurrency } from "@/components/workspace/workspace-utils";
import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

type CollectionsSectionProps = {
  controller: WorkspaceController;
  data: PhaseTwoWorkspaceData;
};

export function CollectionsSection({
  controller,
  data,
}: CollectionsSectionProps) {
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  return (
    <Section
      eyebrow="Overdue A/R"
      title="Collections queue"
      description="Claims past 90 days with dunning notes and collections handoff tracking."
    >
      <ResponsiveRecords
        columns={[
          { key: "patient", label: "Patient" },
          { key: "amount", label: "Amount" },
          { key: "days", label: "Days overdue" },
          { key: "status", label: "Collections status" },
          { key: "notes", label: "Dunning notes" },
          { key: "action", label: "Action", className: "text-right" },
        ]}
        rows={data.collections}
        getRowKey={(claim) => claim.id}
        renderTableRow={(claim) => (
          <TableRow key={claim.id}>
            <TableCell className="font-medium text-foreground">
              {claim.patient_name}
            </TableCell>
            <TableCell>{formatCurrency(claim.total_amount)}</TableCell>
            <TableCell>{claim.days_overdue} days</TableCell>
            <TableCell>
              <StatusBadge status={claim.collections_status} />
            </TableCell>
            <TableCell className="min-w-72">
              <Textarea
                value={draftNotes[claim.id] ?? claim.dunning_notes ?? ""}
                onChange={(event) =>
                  setDraftNotes((current) => ({
                    ...current,
                    [claim.id]: event.target.value,
                  }))
                }
                onBlur={() =>
                  controller.collections.updateNotes(
                    claim,
                    draftNotes[claim.id] ?? claim.dunning_notes ?? ""
                  )
                }
                rows={3}
              />
            </TableCell>
            <TableCell className="text-right">
              <Button type="button" size="sm" onClick={() => controller.collections.markSent(claim)}>
                <Send className="size-4" />
                Mark sent
              </Button>
            </TableCell>
          </TableRow>
        )}
        renderMobileCard={(claim) => (
          <AppCard className="border-border/70 bg-white/70 shadow-sm">
            <AppCardHeader className="px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <AppCardTitle className="text-lg">{claim.patient_name}</AppCardTitle>
                  <AppCardDescription>{claim.days_overdue} days overdue</AppCardDescription>
                </div>
                <StatusBadge status={claim.collections_status} />
              </div>
            </AppCardHeader>
            <AppCardContent className="space-y-4 px-5 pb-5">
              <p className="font-medium text-foreground">{formatCurrency(claim.total_amount)}</p>
              <Textarea
                value={draftNotes[claim.id] ?? claim.dunning_notes ?? ""}
                onChange={(event) =>
                  setDraftNotes((current) => ({
                    ...current,
                    [claim.id]: event.target.value,
                  }))
                }
                onBlur={() =>
                  controller.collections.updateNotes(
                    claim,
                    draftNotes[claim.id] ?? claim.dunning_notes ?? ""
                  )
                }
                rows={4}
              />
              <Button type="button" className="w-full" onClick={() => controller.collections.markSent(claim)}>
                Mark sent to collections
              </Button>
            </AppCardContent>
          </AppCard>
        )}
        emptyMessage="No claims are in collections right now."
        emptyDetail="Overdue exposure appears here once submitted claims cross the 90-day threshold or are manually marked sent."
      />
    </Section>
  );
}
