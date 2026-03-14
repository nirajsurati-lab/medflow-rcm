"use client";

import { ShieldCheck } from "lucide-react";

import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/components/system/card";
import { FormField } from "@/components/system/form-field";
import { ResponsiveRecords } from "@/components/system/responsive-records";
import { Section } from "@/components/system/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/workspace/shared/status-badge";
import type { WorkspaceController } from "@/components/workspace/types";
import { formatDate } from "@/components/workspace/workspace-utils";
import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

type AuthorizationsSectionProps = {
  controller: WorkspaceController;
  data: PhaseTwoWorkspaceData;
};

export function AuthorizationsSection({
  controller,
  data,
}: AuthorizationsSectionProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
      <Section
        eyebrow="Prior Auth"
        title="Create authorization"
        description="Capture authorization coverage before claim submission."
      >
        <form className="space-y-4" onSubmit={controller.authorizations.submit}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Patient">
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={controller.authorizations.form.patient_id}
                onChange={(event) =>
                  controller.authorizations.updateField("patient_id", event.target.value)
                }
                required
              >
                <option value="">Select patient</option>
                {controller.shared.patientOptions.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Payer">
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={controller.authorizations.form.payer_id}
                onChange={(event) =>
                  controller.authorizations.updateField("payer_id", event.target.value)
                }
                required
              >
                <option value="">Select payer</option>
                {controller.shared.payerOptions.map((payer) => (
                  <option key={payer.id} value={payer.id}>
                    {payer.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Status">
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={controller.authorizations.form.status}
                onChange={(event) =>
                  controller.authorizations.updateField("status", event.target.value)
                }
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="denied">Denied</option>
                <option value="expired">Expired</option>
              </select>
            </FormField>
            <FormField label="Procedure codes" hint="Comma-separated CPT codes.">
              <Input
                value={controller.authorizations.form.procedure_codes}
                onChange={(event) =>
                  controller.authorizations.updateField(
                    "procedure_codes",
                    event.target.value
                  )
                }
                placeholder="99213, 93000"
                required
              />
            </FormField>
            <FormField label="Valid from">
              <Input
                type="date"
                value={controller.authorizations.form.valid_from}
                onChange={(event) =>
                  controller.authorizations.updateField("valid_from", event.target.value)
                }
              />
            </FormField>
            <FormField label="Valid to">
              <Input
                type="date"
                value={controller.authorizations.form.valid_to}
                onChange={(event) =>
                  controller.authorizations.updateField("valid_to", event.target.value)
                }
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea
              value={controller.authorizations.form.notes}
              onChange={(event) =>
                controller.authorizations.updateField("notes", event.target.value)
              }
              rows={4}
            />
          </FormField>
          <Button type="submit">
            <ShieldCheck className="size-4" />
            Save authorization
          </Button>
        </form>
      </Section>

      <Section
        eyebrow="Coverage Log"
        title="Authorization roster"
        description="Approved, denied, and expired authorizations across the workspace."
      >
        <ResponsiveRecords
          columns={[
            { key: "patient", label: "Patient" },
            { key: "payer", label: "Payer" },
            { key: "codes", label: "CPT codes" },
            { key: "status", label: "Status" },
            { key: "validity", label: "Validity" },
          ]}
          rows={data.authorizations}
          getRowKey={(authorization) => authorization.id}
          renderTableRow={(authorization) => (
            <TableRow key={authorization.id}>
              <TableCell className="font-medium text-foreground">
                {authorization.patient_name}
              </TableCell>
              <TableCell>{authorization.payer_name}</TableCell>
              <TableCell>{authorization.procedure_codes.join(", ")}</TableCell>
              <TableCell>
                <StatusBadge status={authorization.status} />
              </TableCell>
              <TableCell>
                {formatDate(authorization.valid_from)} to {formatDate(authorization.valid_to)}
              </TableCell>
            </TableRow>
          )}
          renderMobileCard={(authorization) => (
            <AppCard className="border-border/70 bg-white/70 shadow-sm">
              <AppCardHeader className="px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <AppCardTitle className="text-lg">
                      {authorization.patient_name}
                    </AppCardTitle>
                    <AppCardDescription>{authorization.payer_name}</AppCardDescription>
                  </div>
                  <StatusBadge status={authorization.status} />
                </div>
              </AppCardHeader>
              <AppCardContent className="space-y-3 px-5 pb-5">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    CPT codes
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {authorization.procedure_codes.join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Validity
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {formatDate(authorization.valid_from)} to {formatDate(authorization.valid_to)}
                  </p>
                </div>
              </AppCardContent>
            </AppCard>
          )}
          emptyMessage="No prior authorizations logged yet."
          emptyDetail="Create an authorization to unblock matching claims at submission time."
        />
      </Section>
    </div>
  );
}
