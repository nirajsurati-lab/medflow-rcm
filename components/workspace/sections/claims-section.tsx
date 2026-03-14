"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  ReceiptText,
  ShieldCheck,
  Trash2,
  UserRoundPlus,
} from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/workspace/shared/empty-state";
import { SectionToolbar } from "@/components/workspace/shared/section-toolbar";
import { StatusBadge } from "@/components/workspace/shared/status-badge";
import type { WorkspaceController } from "@/components/workspace/types";
import { formatCurrency } from "@/components/workspace/workspace-utils";
import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

type ClaimsSectionProps = {
  controller: WorkspaceController;
  data: PhaseTwoWorkspaceData;
};

export function ClaimsSection({
  controller,
  data,
}: ClaimsSectionProps) {
  const isBusy = controller.meta.pendingAction !== null;
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [payerDialogOpen, setPayerDialogOpen] = useState(false);

  useEffect(() => {
    const title = controller.meta.feedback?.title;

    if (!controller.meta.pendingAction && title === "Provider added") {
      setProviderDialogOpen(false);
    }

    if (!controller.meta.pendingAction && title === "Payer added") {
      setPayerDialogOpen(false);
    }
  }, [controller.meta.feedback?.title, controller.meta.pendingAction]);

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Section
          eyebrow="Claim Intake"
          title="Claim draft builder"
          description="Keep the core claim workflow inline so procedures, diagnoses, and totals stay visible while you work."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProviderDialogOpen(true)}
              >
                <UserRoundPlus className="size-4" />
                Add provider
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayerDialogOpen(true)}
              >
                <Building2 className="size-4" />
                Add payer
              </Button>
            </div>
          }
        >
          <form className="space-y-5" onSubmit={controller.claims.submitDraft}>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Patient">
                <Select
                  value={controller.claims.form.patient_id}
                  onValueChange={(value) =>
                    controller.claims.updateField("patient_id", value ?? "")
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
              <FormField label="Provider">
                <Select
                  value={controller.claims.form.provider_id}
                  onValueChange={(value) =>
                    controller.claims.updateField("provider_id", value ?? "")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.first_name} {provider.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Payer">
                <Select
                  value={controller.claims.form.payer_id}
                  onValueChange={(value) =>
                    controller.claims.updateField("payer_id", value ?? "")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payer" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.payers.map((payer) => (
                      <SelectItem key={payer.id} value={payer.id}>
                        {payer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="space-y-3">
              <SectionToolbar
                title="Procedures"
                description="At least one CPT line is required for the draft."
                actions={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={controller.claims.addProcedure}
                    disabled={isBusy}
                  >
                    <Plus className="size-4" />
                    Add procedure
                  </Button>
                }
              />

              <div className="space-y-3">
                {controller.claims.form.procedures.map((procedure, index) => (
                  <AppCard
                    key={`procedure-${index}`}
                    className="border-border/70 bg-white/68 shadow-sm"
                  >
                    <AppCardContent className="px-5 py-5">
                      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr_0.55fr_0.7fr_0.7fr_auto]">
                        <FormField label="CPT code">
                          <Input
                            value={procedure.cpt_code}
                            onChange={(event) =>
                              controller.claims.updateProcedureField(
                                index,
                                "cpt_code",
                                event.target.value
                              )
                            }
                            required
                          />
                        </FormField>
                        <FormField label="Description">
                          <Input
                            value={procedure.description}
                            onChange={(event) =>
                              controller.claims.updateProcedureField(
                                index,
                                "description",
                                event.target.value
                              )
                            }
                          />
                        </FormField>
                        <FormField label="Units">
                          <Input
                            type="number"
                            min={1}
                            value={procedure.units}
                            onChange={(event) =>
                              controller.claims.updateProcedureField(
                                index,
                                "units",
                                event.target.value
                              )
                            }
                            required
                          />
                        </FormField>
                        <FormField label="Charge">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={procedure.charge_amount}
                            onChange={(event) =>
                              controller.claims.updateProcedureField(
                                index,
                                "charge_amount",
                                event.target.value
                              )
                            }
                            required
                          />
                        </FormField>
                        <FormField label="Allowed">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={procedure.allowed_amount}
                            onChange={(event) =>
                              controller.claims.updateProcedureField(
                                index,
                                "allowed_amount",
                                event.target.value
                              )
                            }
                            required
                          />
                        </FormField>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => controller.claims.removeProcedure(index)}
                            disabled={
                              isBusy || controller.claims.form.procedures.length === 1
                            }
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Remove procedure</span>
                          </Button>
                        </div>
                      </div>
                    </AppCardContent>
                  </AppCard>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <SectionToolbar
                title="Diagnoses"
                description="At least one ICD-10 diagnosis is required."
                actions={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={controller.claims.addDiagnosis}
                    disabled={isBusy}
                  >
                    <Plus className="size-4" />
                    Add diagnosis
                  </Button>
                }
              />

              <div className="space-y-3">
                {controller.claims.form.diagnoses.map((diagnosis, index) => (
                  <AppCard
                    key={`diagnosis-${index}`}
                    className="border-border/70 bg-white/68 shadow-sm"
                  >
                    <AppCardContent className="px-5 py-5">
                      <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr_0.55fr_auto]">
                        <FormField label="ICD-10 code">
                          <Input
                            value={diagnosis.icd10_code}
                            onChange={(event) =>
                              controller.claims.updateDiagnosisField(
                                index,
                                "icd10_code",
                                event.target.value
                              )
                            }
                            required
                          />
                        </FormField>
                        <FormField label="Description">
                          <Input
                            value={diagnosis.description}
                            onChange={(event) =>
                              controller.claims.updateDiagnosisField(
                                index,
                                "description",
                                event.target.value
                              )
                            }
                          />
                        </FormField>
                        <FormField label="Sequence">
                          <Input
                            type="number"
                            min={1}
                            value={diagnosis.sequence}
                            onChange={(event) =>
                              controller.claims.updateDiagnosisField(
                                index,
                                "sequence",
                                event.target.value
                              )
                            }
                            required
                          />
                        </FormField>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => controller.claims.removeDiagnosis(index)}
                            disabled={
                              isBusy || controller.claims.form.diagnoses.length === 1
                            }
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Remove diagnosis</span>
                          </Button>
                        </div>
                      </div>
                    </AppCardContent>
                  </AppCard>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[26px] border border-border/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(20,44,88,0.92))] px-5 py-5 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  Draft total
                </p>
                <p className="mt-2 font-heading text-3xl font-semibold">
                  {formatCurrency(controller.claims.draftTotal)}
                </p>
              </div>
              <Button type="submit" disabled={isBusy}>
                <ReceiptText className="size-4" />
                Save draft claim
              </Button>
            </div>
          </form>
        </Section>

        <div className="space-y-4">
          <AppCard className="overflow-hidden border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(236,247,255,0.74))]">
            <AppCardHeader className="border-b border-border/60 px-6 py-5">
              <AppCardTitle className="text-xl">Master data at a glance</AppCardTitle>
              <AppCardDescription>
                Fill lookup gaps without leaving claim intake.
              </AppCardDescription>
            </AppCardHeader>
            <AppCardContent className="space-y-4 px-6 py-6">
              <div className="grid gap-3">
                <div className="rounded-[22px] border border-border/70 bg-white/75 p-4">
                  <div className="flex items-center gap-2 text-sky-700">
                    <UserRoundPlus className="size-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Providers
                    </p>
                  </div>
                  <p className="mt-2 font-heading text-2xl font-semibold text-foreground">
                    {data.providers.length}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Rendering providers available for draft selection.
                  </p>
                </div>
                <div className="rounded-[22px] border border-border/70 bg-white/75 p-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Building2 className="size-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Payers
                    </p>
                  </div>
                  <p className="mt-2 font-heading text-2xl font-semibold text-foreground">
                    {data.payers.length}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Payers configured for manual claim workflows.
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <Button type="button" variant="outline" onClick={() => setProviderDialogOpen(true)}>
                  <UserRoundPlus className="size-4" />
                  Quick add provider
                </Button>
                <Button type="button" variant="outline" onClick={() => setPayerDialogOpen(true)}>
                  <Building2 className="size-4" />
                  Quick add payer
                </Button>
              </div>
            </AppCardContent>
          </AppCard>

          <AppCard className="border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(232,255,246,0.7))]">
            <AppCardHeader className="px-6 py-5">
              <AppCardTitle className="text-xl">Submission guidance</AppCardTitle>
              <AppCardDescription>
                Save draft claims first, then submit from the queue once all details are ready.
              </AppCardDescription>
            </AppCardHeader>
            <AppCardContent className="space-y-3 px-6 pb-6">
              <div className="rounded-[22px] border border-border/70 bg-white/75 px-4 py-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <ShieldCheck className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Submission rule
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  Draft claims remain editable until you submit them from the queue below.
                </p>
              </div>
              <div className="rounded-[22px] border border-border/70 bg-white/75 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Current draft total
                </p>
                <p className="mt-2 font-heading text-2xl font-semibold text-foreground">
                  {formatCurrency(controller.claims.draftTotal)}
                </p>
              </div>
            </AppCardContent>
          </AppCard>
        </div>
      </div>

      <Section
        eyebrow="Submission Queue"
        title="Claims queue"
        description="Unpaid claims with aging context and the next operational action."
      >
        {data.dashboard.claims_queue.length > 0 ? (
          <ResponsiveRecords
            columns={[
              { key: "patient", label: "Patient" },
              { key: "payer", label: "Payer" },
              { key: "status", label: "Status" },
              { key: "age", label: "Age" },
              { key: "bucket", label: "Bucket" },
              { key: "outstanding", label: "Outstanding" },
              { key: "recommended", label: "Recommended action" },
              { key: "action", label: "Action", className: "text-right" },
            ]}
            rows={data.dashboard.claims_queue}
            getRowKey={(claim) => claim.id}
            renderTableRow={(claim) => (
              <TableRow key={claim.id}>
                <TableCell className="font-medium text-foreground">
                  {claim.patient_name}
                </TableCell>
                <TableCell>{claim.payer_name}</TableCell>
                <TableCell>
                  <StatusBadge status={claim.status} />
                </TableCell>
                <TableCell>{claim.days_open} days</TableCell>
                <TableCell>{claim.aging_bucket}</TableCell>
                <TableCell>{formatCurrency(claim.outstanding_amount)}</TableCell>
                <TableCell>{claim.recommended_action}</TableCell>
                <TableCell className="text-right">
                  {claim.status === "draft" ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => controller.claims.submitClaim(claim)}
                      disabled={isBusy}
                    >
                      Submit
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">No action</span>
                  )}
                </TableCell>
              </TableRow>
            )}
            renderMobileCard={(claim) => (
              <AppCard className="border-border/70 bg-white/70 shadow-sm">
                <AppCardHeader className="px-5 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <AppCardTitle className="text-lg">{claim.patient_name}</AppCardTitle>
                      <AppCardDescription>{claim.payer_name}</AppCardDescription>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>
                </AppCardHeader>
                <AppCardContent className="space-y-4 px-5 pb-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Aging
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {claim.days_open} days · {claim.aging_bucket}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Outstanding
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {formatCurrency(claim.outstanding_amount)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-[22px] bg-muted/45 px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Recommended action
                    </p>
                    <p className="mt-1 text-sm leading-6 text-foreground">
                      {claim.recommended_action}
                    </p>
                  </div>
                  {claim.status === "draft" ? (
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => controller.claims.submitClaim(claim)}
                      disabled={isBusy}
                    >
                      Submit claim
                    </Button>
                  ) : null}
                </AppCardContent>
              </AppCard>
            )}
            emptyMessage="No claims in the queue yet."
            emptyDetail="Draft a claim and it will appear here with aging context and recommended next steps."
          />
        ) : (
          <EmptyState
            message="No claims in the queue yet."
            detail="Draft a claim and it will appear here with aging context and recommended next steps."
          />
        )}
      </Section>

      <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Quick add provider</DialogTitle>
            <DialogDescription>
              Add a rendering provider without leaving the claim builder.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={controller.lookups.submitProvider}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="First name" htmlFor="provider-first-name">
                <Input
                  id="provider-first-name"
                  value={controller.lookups.providerForm.first_name}
                  onChange={(event) =>
                    controller.lookups.updateProviderField(
                      "first_name",
                      event.target.value
                    )
                  }
                  required
                />
              </FormField>
              <FormField label="Last name" htmlFor="provider-last-name">
                <Input
                  id="provider-last-name"
                  value={controller.lookups.providerForm.last_name}
                  onChange={(event) =>
                    controller.lookups.updateProviderField(
                      "last_name",
                      event.target.value
                    )
                  }
                  required
                />
              </FormField>
              <FormField label="NPI" htmlFor="provider-npi">
                <Input
                  id="provider-npi"
                  value={controller.lookups.providerForm.npi}
                  onChange={(event) =>
                    controller.lookups.updateProviderField("npi", event.target.value)
                  }
                  required
                />
              </FormField>
              <FormField label="Specialty" htmlFor="provider-specialty" hint="Optional">
                <Input
                  id="provider-specialty"
                  value={controller.lookups.providerForm.specialty}
                  onChange={(event) =>
                    controller.lookups.updateProviderField(
                      "specialty",
                      event.target.value
                    )
                  }
                />
              </FormField>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" disabled={isBusy}>
                Save provider
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={payerDialogOpen} onOpenChange={setPayerDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Quick add payer</DialogTitle>
            <DialogDescription>
              Add a payer configuration without leaving the current claim draft.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={controller.lookups.submitPayer}>
            <FormField label="Payer name" htmlFor="payer-name">
              <Input
                id="payer-name"
                value={controller.lookups.payerForm.name}
                onChange={(event) =>
                  controller.lookups.updatePayerField("name", event.target.value)
                }
                required
              />
            </FormField>
            <FormField label="Payer ID" htmlFor="payer-id">
              <Input
                id="payer-id"
                value={controller.lookups.payerForm.payer_id}
                onChange={(event) =>
                  controller.lookups.updatePayerField("payer_id", event.target.value)
                }
                required
              />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Contact email" htmlFor="payer-email" hint="Optional">
                <Input
                  id="payer-email"
                  type="email"
                  value={controller.lookups.payerForm.contact_email}
                  onChange={(event) =>
                    controller.lookups.updatePayerField(
                      "contact_email",
                      event.target.value
                    )
                  }
                />
              </FormField>
              <FormField label="Contact phone" htmlFor="payer-phone" hint="Optional">
                <Input
                  id="payer-phone"
                  value={controller.lookups.payerForm.contact_phone}
                  onChange={(event) =>
                    controller.lookups.updatePayerField(
                      "contact_phone",
                      event.target.value
                    )
                  }
                />
              </FormField>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" disabled={isBusy}>
                Save payer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
