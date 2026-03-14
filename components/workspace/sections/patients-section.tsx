"use client";

import { Save, Trash2 } from "lucide-react";

import { DataTable } from "@/components/system/data-table";
import { FormField } from "@/components/system/form-field";
import { Section } from "@/components/system/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { TableCell, TableRow } from "@/components/ui/table";
import type { WorkspaceController } from "@/components/workspace/types";
import {
  formatDate,
  formatPatientAddress,
} from "@/components/workspace/workspace-utils";

type PatientsSectionProps = {
  controller: WorkspaceController;
};

export function PatientsSection({
  controller,
}: PatientsSectionProps) {
  const isBusy = controller.meta.pendingAction !== null;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_1.45fr]">
      <Section
        title={controller.patients.editingPatientId ? "Edit patient" : "New patient intake"}
        description="Capture demographics for manual claim entry."
      >
        <form className="space-y-4" onSubmit={controller.patients.submit}>
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

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isBusy}>
              <Save className="size-4" />
              {controller.patients.editingPatientId ? "Save patient" : "Create patient"}
            </Button>
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
          </div>
        </form>
      </Section>

      <Section
        title="Patient roster"
        description="Update or delete existing patient records."
        actions={
          <div className="w-full md:max-w-xs">
            <Input
              id="patient-search"
              placeholder="Search patient or insurance ID"
              value={controller.patients.search}
              onChange={(event) => controller.patients.setSearch(event.target.value)}
            />
          </div>
        }
      >
        <DataTable
          columns={[
            { key: "patient", label: "Patient" },
            { key: "dob", label: "DOB" },
            { key: "insurance", label: "Insurance" },
            { key: "address", label: "Address" },
            { key: "actions", label: "Actions", className: "text-right" },
          ]}
          rows={controller.patients.filtered}
          getRowKey={(patient) => patient.id}
          renderRow={(patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-medium text-slate-950">
                {patient.first_name} {patient.last_name}
              </TableCell>
              <TableCell>{formatDate(patient.dob)}</TableCell>
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
                    onClick={() => controller.patients.hydrate(patient)}
                    disabled={isBusy}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => controller.patients.remove(patient)}
                    disabled={isBusy}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
          emptyMessage="No patients match the current search."
        />
      </Section>
    </div>
  );
}
