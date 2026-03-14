"use client";

import { Plus, ReceiptText, Trash2 } from "lucide-react";

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
import type { WorkspaceController } from "@/components/workspace/types";
import { EmptyState } from "@/components/workspace/shared/empty-state";
import { SectionToolbar } from "@/components/workspace/shared/section-toolbar";
import { StatusBadge } from "@/components/workspace/shared/status-badge";
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

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Section
          title="Claim draft builder"
          description="Manual claim intake with procedure and diagnosis rows."
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
                description="At least one CPT line is required."
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
                  <div
                    key={`procedure-${index}`}
                    className="rounded-2xl border border-slate-200/80 p-4"
                  >
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
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <SectionToolbar
                title="Diagnoses"
                description="At least one ICD-10 code is required."
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
                  <div
                    key={`diagnosis-${index}`}
                    className="rounded-2xl border border-slate-200/80 p-4"
                  >
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
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm text-slate-600">Draft total</p>
                <p className="text-xl font-semibold text-slate-950">
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
          <Section
            title="Provider quick add"
            description="Keep setup inside the claim workflow."
          >
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
                <FormField label="Specialty" htmlFor="provider-specialty">
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
              <Button type="submit" disabled={isBusy}>
                Save provider
              </Button>
            </form>
          </Section>

          <Section
            title="Payer quick add"
            description="Manual entry only, no clearinghouse integration."
          >
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
                <FormField label="Contact email" htmlFor="payer-email">
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
                <FormField label="Contact phone" htmlFor="payer-phone">
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
              <Button type="submit" disabled={isBusy}>
                Save payer
              </Button>
            </form>
          </Section>
        </div>
      </div>

      <Section
        title="Claims queue"
        description="Unpaid claims with aging context for manual follow-up."
      >
        {data.dashboard.claims_queue.length > 0 ? (
          <DataTable
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
            renderRow={(claim) => (
              <TableRow key={claim.id}>
                <TableCell className="font-medium text-slate-950">
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
                    <span className="text-sm text-slate-500">No action</span>
                  )}
                </TableCell>
              </TableRow>
            )}
            emptyMessage="No claims in the queue yet."
          />
        ) : (
          <EmptyState
            message="No claims in the queue yet."
            detail="Draft a claim and it will appear here with aging context and recommended next steps."
          />
        )}
      </Section>
    </>
  );
}
