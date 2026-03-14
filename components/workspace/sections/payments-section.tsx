"use client";

import { useEffect, useState } from "react";
import { BadgeDollarSign, ExternalLink, Link2, Plus } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const title = controller.meta.feedback?.title;

    if (
      isSheetOpen &&
      !controller.meta.pendingAction &&
      title === "Payment link created"
    ) {
      setIsSheetOpen(false);
    }
  }, [controller.meta.feedback?.title, controller.meta.pendingAction, isSheetOpen]);

  return (
    <>
      {controller.payments.latestLink ? (
        <AppCard className="overflow-hidden border-border/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(228,255,246,0.72)_45%,rgba(227,244,255,0.68))]">
          <AppCardHeader className="space-y-3 border-b border-border/60 px-6 py-5">
            <AppCardTitle className="text-xl">Checkout link ready</AppCardTitle>
            <AppCardDescription>
              Open the payment link to collect patient funds and feed the statement workflow.
            </AppCardDescription>
          </AppCardHeader>
          <AppCardContent className="space-y-4 px-6 py-6">
            <div className="rounded-[22px] border border-border/70 bg-white/80 px-4 py-4 text-sm leading-6 text-foreground">
              <p className="break-all">{controller.payments.latestLink}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={controller.payments.openLatestLink}>
                <ExternalLink className="size-4" />
                Open payment link
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={controller.payments.copyLatestLink}
              >
                <Link2 className="size-4" />
                Copy link
              </Button>
            </div>
          </AppCardContent>
        </AppCard>
      ) : null}

      <Section
        eyebrow="Patient Payments"
        title="Payment records"
        description="Monitor pending and completed payment attempts while comparing billed, allowed, and paid amounts."
        actions={
          <Button type="button" onClick={() => setIsSheetOpen(true)}>
            <Plus className="size-4" />
            New payment link
          </Button>
        }
      >
        <ResponsiveRecords
          columns={[
            { key: "patient", label: "Patient" },
            { key: "paid", label: "Paid" },
            { key: "billed", label: "Billed" },
            { key: "allowed", label: "Allowed" },
            { key: "status", label: "Status" },
            { key: "method", label: "Method" },
            { key: "created", label: "Created" },
          ]}
          rows={data.payments}
          getRowKey={(payment) => payment.id}
          renderTableRow={(payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium text-foreground">
                {payment.patient_name}
              </TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>{formatCurrency(payment.billed_amount)}</TableCell>
              <TableCell>{formatCurrency(payment.allowed_amount)}</TableCell>
              <TableCell>
                <StatusBadge status={payment.status} />
              </TableCell>
              <TableCell>{formatPaymentMethod(payment.method)}</TableCell>
              <TableCell>{formatDateTime(payment.created_at)}</TableCell>
            </TableRow>
          )}
          renderMobileCard={(payment) => (
            <AppCard className="border-border/70 bg-white/70 shadow-sm">
              <AppCardHeader className="px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <AppCardTitle className="text-lg">{payment.patient_name}</AppCardTitle>
                    <AppCardDescription>
                      {formatDateTime(payment.created_at)}
                    </AppCardDescription>
                  </div>
                  <StatusBadge status={payment.status} />
                </div>
              </AppCardHeader>
              <AppCardContent className="space-y-4 px-5 pb-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Amount
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Billed / Allowed
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {formatCurrency(payment.billed_amount)} / {formatCurrency(payment.allowed_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Method
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {formatPaymentMethod(payment.method)}
                    </p>
                  </div>
                </div>
              </AppCardContent>
            </AppCard>
          )}
          emptyMessage="No payment links generated yet."
          emptyDetail="Create a payment link to collect funds and compare actual payments against billed and allowed totals."
          emptyAction={
            <Button type="button" onClick={() => setIsSheetOpen(true)}>
              <BadgeDollarSign className="size-4" />
              Create payment link
            </Button>
          }
        />
      </Section>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-[100vw] max-w-none border-l border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,248,255,0.95))] sm:max-w-xl"
        >
          <SheetHeader className="pb-0">
            <SheetTitle className="font-heading text-2xl">Create payment link</SheetTitle>
            <SheetDescription>
              Generate an internal payment link for patient balance collection.
            </SheetDescription>
          </SheetHeader>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={controller.payments.submit}>
            <ScrollArea className="min-h-0 flex-1 px-4 pb-4">
              <div className="space-y-5 pr-2">
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
                <FormField
                  label="Related claim"
                  hint="Optional link for payment reconciliation."
                >
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
                        controller.payments.updateField("description", event.target.value)
                      }
                      required
                    />
                  </FormField>
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="border-t border-border/60 bg-white/85">
              <Button type="submit" disabled={isBusy}>
                <BadgeDollarSign className="size-4" />
                Create payment link
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
