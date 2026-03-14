"use client";

import { DataTable } from "@/components/system/data-table";
import { FormField } from "@/components/system/form-field";
import { Section } from "@/components/system/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/workspace/shared/status-badge";
import type { WorkspaceController } from "@/components/workspace/types";
import {
  formatDate,
  formatDateTime,
} from "@/components/workspace/workspace-utils";
import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

type DenialsSectionProps = {
  controller: WorkspaceController;
  data: PhaseTwoWorkspaceData;
};

export function DenialsSection({
  controller,
  data,
}: DenialsSectionProps) {
  const isBusy = controller.meta.pendingAction !== null;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Section
        title="Log denial"
        description="Capture payer feedback and mark the claim as denied."
      >
        <form className="space-y-4" onSubmit={controller.denials.submit}>
          <FormField label="Claim">
            <Select
              value={controller.denials.form.claim_id}
              onValueChange={(value) =>
                controller.denials.updateField("claim_id", value ?? "")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select claim" />
              </SelectTrigger>
              <SelectContent>
                {controller.shared.claimOptions.map((claim) => (
                  <SelectItem key={claim.id} value={claim.id}>
                    {claim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Reason code" htmlFor="denial-reason-code">
              <Input
                id="denial-reason-code"
                value={controller.denials.form.reason_code}
                onChange={(event) =>
                  controller.denials.updateField("reason_code", event.target.value)
                }
                required
              />
            </FormField>
            <FormField
              label="Appeal deadline"
              htmlFor="denial-appeal-deadline"
              hint="Optional"
            >
              <Input
                id="denial-appeal-deadline"
                type="date"
                value={controller.denials.form.appeal_deadline}
                onChange={(event) =>
                  controller.denials.updateField(
                    "appeal_deadline",
                    event.target.value
                  )
                }
              />
            </FormField>
          </div>
          <FormField label="Reason description" htmlFor="denial-reason-desc">
            <Textarea
              id="denial-reason-desc"
              value={controller.denials.form.reason_desc}
              onChange={(event) =>
                controller.denials.updateField("reason_desc", event.target.value)
              }
              rows={5}
              required
            />
          </FormField>
          <Button type="submit" disabled={isBusy}>
            Save denial
          </Button>
        </form>
      </Section>

      <Section
        title="Denial log"
        description="Open denials captured for follow-up and appeal tracking."
      >
        <DataTable
          columns={[
            { key: "reason-code", label: "Reason code" },
            { key: "description", label: "Description" },
            { key: "claim-status", label: "Claim status" },
            { key: "appeal-deadline", label: "Appeal deadline" },
            { key: "created", label: "Created" },
          ]}
          rows={data.denials}
          getRowKey={(denial) => denial.id}
          renderRow={(denial) => (
            <TableRow key={denial.id}>
              <TableCell className="font-medium text-slate-950">
                {denial.reason_code}
              </TableCell>
              <TableCell className="max-w-md whitespace-normal">
                {denial.reason_desc}
              </TableCell>
              <TableCell>
                <StatusBadge status={denial.claim_status} />
              </TableCell>
              <TableCell>
                {denial.appeal_deadline
                  ? formatDate(denial.appeal_deadline)
                  : "Not set"}
              </TableCell>
              <TableCell>{formatDateTime(denial.created_at)}</TableCell>
            </TableRow>
          )}
          emptyMessage="No denials logged yet."
        />
      </Section>
    </div>
  );
}
