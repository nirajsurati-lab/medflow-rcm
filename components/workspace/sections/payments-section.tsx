"use client";

import { BadgeDollarSign } from "lucide-react";

import { DataTable } from "@/components/system/data-table";
import { FormField } from "@/components/system/form-field";
import { Section } from "@/components/system/section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { StatusBadge } from "@/components/workspace/shared/status-badge";
import type { WorkspaceController } from "@/components/workspace/types";
import {
  formatCurrency,
  formatDateTime,
  formatPaymentMethod,
} from "@/components/workspace/workspace-utils";
import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

type PaymentsSectionProps = {
  controller: WorkspaceController;
  data: PhaseTwoWorkspaceData;
};

export function PaymentsSection({
  controller,
  data,
}: PaymentsSectionProps) {
  const isBusy = controller.meta.pendingAction !== null;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Section
        title="Demo payment link"
        description="Generate an internal demo checkout URL for hackathon patient payment flows."
      >
        <div className="space-y-4">
          <form className="space-y-4" onSubmit={controller.payments.submit}>
            <FormField label="Patient">
              <Select
                value={controller.payments.form.patient_id}
                onValueChange={(value) =>
                  controller.payments.updateField("patient_id", value ?? "")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {controller.shared.patientOptions.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Related claim" hint="Optional claim for payment reconciliation.">
              <Select
                value={controller.payments.form.claim_id || "__none__"}
                onValueChange={(value) =>
                  controller.payments.updateField(
                    "claim_id",
                    value === "__none__" ? "" : value ?? ""
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Optional claim" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No claim</SelectItem>
                  {controller.shared.claimOptions.map((claim) => (
                    <SelectItem key={claim.id} value={claim.id}>
                      {claim.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Amount" htmlFor="payment-amount">
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min={0.01}
                  value={controller.payments.form.amount}
                  onChange={(event) =>
                    controller.payments.updateField("amount", event.target.value)
                  }
                  required
                />
              </FormField>
              <FormField label="Description" htmlFor="payment-description">
                <Input
                  id="payment-description"
                  value={controller.payments.form.description}
                  onChange={(event) =>
                    controller.payments.updateField(
                      "description",
                      event.target.value
                    )
                  }
                  required
                />
              </FormField>
            </div>
            <Button type="submit" disabled={isBusy}>
              <BadgeDollarSign className="size-4" />
              Create payment link
            </Button>
          </form>

          {controller.payments.latestLink ? (
            <Alert>
              <AlertTitle>Checkout link ready</AlertTitle>
              <AlertDescription>
                <div className="space-y-3">
                  <p className="break-all text-sm">{controller.payments.latestLink}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={controller.payments.openLatestLink}>
                      Open demo checkout
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={controller.payments.copyLatestLink}
                    >
                      Copy link
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </Section>

      <Section
        title="Payment records"
        description="Pending and completed patient payment attempts."
      >
        <DataTable
          columns={[
            { key: "patient", label: "Patient" },
            { key: "amount", label: "Amount" },
            { key: "status", label: "Status" },
            { key: "method", label: "Method" },
            { key: "created", label: "Created" },
          ]}
          rows={data.payments}
          getRowKey={(payment) => payment.id}
          renderRow={(payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium text-slate-950">
                {payment.patient_name}
              </TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>
                <StatusBadge status={payment.status} />
              </TableCell>
              <TableCell>{formatPaymentMethod(payment.method)}</TableCell>
              <TableCell>{formatDateTime(payment.created_at)}</TableCell>
            </TableRow>
          )}
          emptyMessage="No payment links generated yet."
        />
      </Section>
    </div>
  );
}
