"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";

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
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const title = controller.meta.feedback?.title;

    if (isSheetOpen && !controller.meta.pendingAction && title === "Denial logged") {
      setIsSheetOpen(false);
    }
  }, [controller.meta.feedback?.title, controller.meta.pendingAction, isSheetOpen]);

  return (
    <>
      <Section
        eyebrow="Payer Feedback"
        title="Denial log"
        description="Keep denial follow-up visible while opening new denial capture in a side panel."
        actions={
          <Button type="button" onClick={() => setIsSheetOpen(true)}>
            <Plus className="size-4" />
            Log denial
          </Button>
        }
      >
        <ResponsiveRecords
          columns={[
            { key: "reason-code", label: "Reason code" },
            { key: "description", label: "Description" },
            { key: "claim-status", label: "Claim status" },
            { key: "appeal-deadline", label: "Appeal deadline" },
            { key: "created", label: "Created" },
          ]}
          rows={data.denials}
          getRowKey={(denial) => denial.id}
          renderTableRow={(denial) => (
            <TableRow key={denial.id}>
              <TableCell className="font-medium text-foreground">
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
          renderMobileCard={(denial) => (
            <AppCard className="border-border/70 bg-white/70 shadow-sm">
              <AppCardHeader className="px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <AppCardTitle className="text-lg">
                      Reason {denial.reason_code}
                    </AppCardTitle>
                    <AppCardDescription>
                      {formatDateTime(denial.created_at)}
                    </AppCardDescription>
                  </div>
                  <StatusBadge status={denial.claim_status} />
                </div>
              </AppCardHeader>
              <AppCardContent className="space-y-4 px-5 pb-5">
                <p className="text-sm leading-6 text-foreground">
                  {denial.reason_desc}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Appeal deadline
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {denial.appeal_deadline
                        ? formatDate(denial.appeal_deadline)
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Claim status
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {denial.claim_status}
                    </p>
                  </div>
                </div>
              </AppCardContent>
            </AppCard>
          )}
          emptyMessage="No denials logged yet."
          emptyDetail="Log a denial to track payer feedback, reason codes, and upcoming appeal work."
          emptyAction={
            <Button type="button" onClick={() => setIsSheetOpen(true)}>
              <AlertTriangle className="size-4" />
              Capture first denial
            </Button>
          }
        />
      </Section>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-[100vw] max-w-none border-l border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,247,255,0.95))] sm:max-w-xl"
        >
          <SheetHeader className="pb-0">
            <SheetTitle className="font-heading text-2xl">Log denial</SheetTitle>
            <SheetDescription>
              Capture payer feedback and mark the related claim as denied for follow-up.
            </SheetDescription>
          </SheetHeader>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={controller.denials.submit}>
            <ScrollArea className="min-h-0 flex-1 px-4 pb-4">
              <div className="space-y-5 pr-2">
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
                    rows={7}
                    required
                  />
                </FormField>
              </div>
            </ScrollArea>

            <SheetFooter className="border-t border-border/60 bg-white/85">
              <Button type="submit" disabled={isBusy}>
                <AlertTriangle className="size-4" />
                Save denial
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
