"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Search, Trash2, UserRoundPen } from "lucide-react";

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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TableCell, TableRow } from "@/components/ui/table";
import type { WorkspaceController, PatientRow } from "@/components/workspace/types";
import {
  formatDate,
  formatPatientAddress,
} from "@/components/workspace/workspace-utils";
import { StatusBadge } from "@/components/workspace/shared/status-badge";

type PatientsSectionProps = {
  controller: WorkspaceController;
};

export function PatientsSection({ controller }: PatientsSectionProps) {
  const isBusy = controller.meta.pendingAction !== null;
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<PatientRow | null>(null);

  useEffect(() => {
    if (controller.patients.editingPatientId) {
      setIsSheetOpen(true);
    }
  }, [controller.patients.editingPatientId]);

  useEffect(() => {
    const title = controller.meta.feedback?.title;

    if (
      isSheetOpen &&
      !controller.meta.pendingAction &&
      (title === "Patient created" || title === "Patient updated")
    ) {
      setIsSheetOpen(false);
    }
  }, [controller.meta.feedback?.title, controller.meta.pendingAction, isSheetOpen]);

  function handleSheetOpenChange(open: boolean) {
    setIsSheetOpen(open);

    if (!open) {
      controller.patients.resetForm();
    }
  }

  function handleCreatePatient() {
    controller.patients.resetForm();
    setIsSheetOpen(true);
  }

  function handleEditPatient(patient: PatientRow) {
    controller.patients.hydrate(patient);
    setIsSheetOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!patientToDelete) {
      return;
    }

    await controller.patients.remove(patientToDelete);
    setPatientToDelete(null);
  }

  return (
    <>
      <Section
        eyebrow="Patient Access"
        title="Patient roster"
        description="Keep the roster current, then open create or edit in a focused side panel."
        actions={
          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <div className="relative min-w-0 sm:min-w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="patient-search"
                className="pl-10"
                placeholder="Search patient or insurance ID"
                value={controller.patients.search}
                onChange={(event) => controller.patients.setSearch(event.target.value)}
              />
            </div>
            <Button type="button" onClick={handleCreatePatient}>
              <Plus className="size-4" />
              New patient
            </Button>
          </div>
        }
      >
        <ResponsiveRecords
          columns={[
            { key: "patient", label: "Patient" },
            { key: "dob", label: "DOB" },
            { key: "auth", label: "Prior auth" },
            { key: "insurance", label: "Insurance" },
            { key: "address", label: "Address" },
            { key: "actions", label: "Actions", className: "text-right" },
          ]}
          rows={controller.patients.filtered}
          getRowKey={(patient) => patient.id}
          renderTableRow={(patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-medium text-foreground">
                {patient.first_name} {patient.last_name}
              </TableCell>
              <TableCell>{formatDate(patient.dob)}</TableCell>
              <TableCell>
                <StatusBadge
                  status={controller.patients.getAuthorizationStatus(patient.id).label.toLowerCase().replace(/\s+/g, "_")}
                  label={controller.patients.getAuthorizationStatus(patient.id).label}
                />
              </TableCell>
              <TableCell>{patient.insurance_id ?? "No ID"}</TableCell>
              <TableCell className="max-w-xs truncate">
                {formatPatientAddress(patient)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditPatient(patient)}
                    disabled={isBusy}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setPatientToDelete(patient)}
                    disabled={isBusy}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
          renderMobileCard={(patient) => (
            <AppCard className="border-border/70 bg-white/70 shadow-sm">
              <AppCardHeader className="px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <AppCardTitle className="text-lg">
                      {patient.first_name} {patient.last_name}
                    </AppCardTitle>
                    <AppCardDescription>{formatDate(patient.dob)}</AppCardDescription>
                    <StatusBadge
                      status={controller.patients.getAuthorizationStatus(patient.id).label.toLowerCase().replace(/\s+/g, "_")}
                      label={controller.patients.getAuthorizationStatus(patient.id).label}
                      className="mt-2"
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    onClick={() => handleEditPatient(patient)}
                    disabled={isBusy}
                  >
                    <UserRoundPen className="size-4" />
                    <span className="sr-only">Edit patient</span>
                  </Button>
                </div>
              </AppCardHeader>
              <AppCardContent className="space-y-4 px-5 pb-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Insurance ID
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {patient.insurance_id ?? "No insurance ID"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Address
                    </p>
                    <p className="mt-1 text-sm leading-6 text-foreground">
                      {formatPatientAddress(patient)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEditPatient(patient)}
                    disabled={isBusy}
                  >
                    Edit record
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setPatientToDelete(patient)}
                    disabled={isBusy}
                  >
                    Delete
                  </Button>
                </div>
              </AppCardContent>
            </AppCard>
          )}
          emptyMessage="No patients match the current search."
          emptyDetail="Create a patient record to begin claims, payments, and denial workflows."
          emptyAction={
            <Button type="button" onClick={handleCreatePatient}>
              <Plus className="size-4" />
              Create patient
            </Button>
          }
        />
      </Section>

      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side="right"
          className="w-[100vw] max-w-none border-l border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,248,255,0.95))] sm:max-w-2xl"
        >
          <SheetHeader className="pb-0">
            <SheetTitle className="font-heading text-2xl">
              {controller.patients.editingPatientId ? "Edit patient" : "New patient intake"}
            </SheetTitle>
            <SheetDescription>
              Capture demographics and insurance details for downstream billing workflows.
            </SheetDescription>
            {controller.patients.editingPatientId ? (
              <div className="pt-3">
                <StatusBadge
                  status={controller.patients.getAuthorizationStatus(controller.patients.editingPatientId).label.toLowerCase().replace(/\s+/g, "_")}
                  label={controller.patients.getAuthorizationStatus(controller.patients.editingPatientId).label}
                />
              </div>
            ) : null}
          </SheetHeader>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={controller.patients.submit}>
            <ScrollArea className="min-h-0 flex-1 px-4 pb-4">
              <div className="space-y-6 pr-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="First name" htmlFor="patient-first-name">
                    <Input
                      id="patient-first-name"
                      value={controller.patients.form.first_name}
                      onChange={(event) =>
                        controller.patients.updateField("first_name", event.target.value)
                      }
                      required
                    />
                  </FormField>
                  <FormField label="Last name" htmlFor="patient-last-name">
                    <Input
                      id="patient-last-name"
                      value={controller.patients.form.last_name}
                      onChange={(event) =>
                        controller.patients.updateField("last_name", event.target.value)
                      }
                      required
                    />
                  </FormField>
                  <FormField label="Date of birth" htmlFor="patient-dob">
                    <Input
                      id="patient-dob"
                      type="date"
                      value={controller.patients.form.dob}
                      onChange={(event) =>
                        controller.patients.updateField("dob", event.target.value)
                      }
                      required
                    />
                  </FormField>
                  <FormField
                    label="Insurance ID"
                    htmlFor="patient-insurance-id"
                    hint="Optional"
                  >
                    <Input
                      id="patient-insurance-id"
                      value={controller.patients.form.insurance_id}
                      onChange={(event) =>
                        controller.patients.updateField("insurance_id", event.target.value)
                      }
                      placeholder="Optional"
                    />
                  </FormField>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="font-heading text-lg font-semibold text-foreground">
                      Address
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Include a mailing address when it is available for follow-up and statements.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      label="Address line 1"
                      htmlFor="patient-line1"
                      className="md:col-span-2"
                    >
                      <Input
                        id="patient-line1"
                        value={controller.patients.form.line1}
                        onChange={(event) =>
                          controller.patients.updateField("line1", event.target.value)
                        }
                      />
                    </FormField>
                    <FormField
                      label="Address line 2"
                      htmlFor="patient-line2"
                      hint="Optional"
                      className="md:col-span-2"
                    >
                      <Input
                        id="patient-line2"
                        value={controller.patients.form.line2}
                        onChange={(event) =>
                          controller.patients.updateField("line2", event.target.value)
                        }
                      />
                    </FormField>
                    <FormField label="City" htmlFor="patient-city">
                      <Input
                        id="patient-city"
                        value={controller.patients.form.city}
                        onChange={(event) =>
                          controller.patients.updateField("city", event.target.value)
                        }
                      />
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="State" htmlFor="patient-state">
                        <Input
                          id="patient-state"
                          maxLength={2}
                          value={controller.patients.form.state}
                          onChange={(event) =>
                            controller.patients.updateField("state", event.target.value)
                          }
                        />
                      </FormField>
                      <FormField label="ZIP" htmlFor="patient-zip">
                        <Input
                          id="patient-zip"
                          value={controller.patients.form.zip}
                          onChange={(event) =>
                            controller.patients.updateField("zip", event.target.value)
                          }
                        />
                      </FormField>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="border-t border-border/60 bg-white/85">
              {controller.patients.editingPatientId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={controller.patients.resetForm}
                  disabled={isBusy}
                >
                  Reset form
                </Button>
              ) : null}
              <Button type="submit" disabled={isBusy}>
                <Save className="size-4" />
                {controller.patients.editingPatientId ? "Save patient" : "Create patient"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(patientToDelete)} onOpenChange={(open) => !open && setPatientToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete patient record?</DialogTitle>
            <DialogDescription>
              {patientToDelete
                ? `This will permanently remove ${patientToDelete.first_name} ${patientToDelete.last_name} from the roster.`
                : "This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isBusy}
            >
              <Trash2 className="size-4" />
              Delete patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
