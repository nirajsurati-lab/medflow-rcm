"use client";

import { CalendarDays, CheckCircle2 } from "lucide-react";

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
import { StatusBadge } from "@/components/workspace/shared/status-badge";
import type { WorkspaceController } from "@/components/workspace/types";
import { formatDateTime } from "@/components/workspace/workspace-utils";
import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

type AppointmentsSectionProps = {
  controller: WorkspaceController;
  data: PhaseTwoWorkspaceData;
};

export function AppointmentsSection({
  controller,
  data,
}: AppointmentsSectionProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
      <Section
        eyebrow="Scheduling"
        title="Create appointment"
        description="Track scheduled visits and move completed work into billing."
      >
        <form className="space-y-4" onSubmit={controller.appointments.submit}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Patient">
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={controller.appointments.form.patient_id}
                onChange={(event) =>
                  controller.appointments.updateField("patient_id", event.target.value)
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
            <FormField label="Provider">
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={controller.appointments.form.provider_id}
                onChange={(event) =>
                  controller.appointments.updateField("provider_id", event.target.value)
                }
                required
              >
                <option value="">Select provider</option>
                {controller.shared.providerOptions.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Payer">
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={controller.appointments.form.payer_id}
                onChange={(event) =>
                  controller.appointments.updateField("payer_id", event.target.value)
                }
              >
                <option value="">Select payer</option>
                {controller.shared.payerOptions.map((payer) => (
                  <option key={payer.id} value={payer.id}>
                    {payer.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Type">
              <Input
                value={controller.appointments.form.type}
                onChange={(event) =>
                  controller.appointments.updateField("type", event.target.value)
                }
                required
              />
            </FormField>
            <FormField label="Scheduled at" hint="Local date and time.">
              <Input
                type="datetime-local"
                value={controller.appointments.form.scheduled_at}
                onChange={(event) =>
                  controller.appointments.updateField("scheduled_at", event.target.value)
                }
                required
              />
            </FormField>
            <FormField label="Status">
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={controller.appointments.form.status}
                onChange={(event) =>
                  controller.appointments.updateField("status", event.target.value)
                }
              >
                <option value="scheduled">Scheduled</option>
                <option value="checked_in">Checked in</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No show</option>
              </select>
            </FormField>
          </div>
          <Button type="submit">
            <CalendarDays className="size-4" />
            Save appointment
          </Button>
        </form>
      </Section>

      <Section
        eyebrow="Calendar Feed"
        title="Appointments"
        description="Completed unbilled visits can be pushed directly into draft claim work."
      >
        <ResponsiveRecords
          columns={[
            { key: "patient", label: "Patient" },
            { key: "provider", label: "Provider" },
            { key: "payer", label: "Payer" },
            { key: "scheduled", label: "Scheduled" },
            { key: "status", label: "Status" },
            { key: "billing", label: "Billing" },
            { key: "action", label: "Action", className: "text-right" },
          ]}
          rows={data.appointments}
          getRowKey={(appointment) => appointment.id}
          renderTableRow={(appointment) => (
            <TableRow key={appointment.id}>
              <TableCell className="font-medium text-foreground">
                {appointment.patient_name}
              </TableCell>
              <TableCell>{appointment.provider_name}</TableCell>
              <TableCell>{appointment.payer_name}</TableCell>
              <TableCell>{formatDateTime(appointment.scheduled_at)}</TableCell>
              <TableCell>
                <StatusBadge status={appointment.status} />
              </TableCell>
              <TableCell>
                <StatusBadge status={appointment.billing_status} />
              </TableCell>
              <TableCell className="text-right">
                {appointment.status !== "completed" || appointment.billing_status === "claimed" ? (
                  <span className="text-sm text-muted-foreground">Tracked</span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => controller.appointments.complete(appointment)}
                  >
                    <CheckCircle2 className="size-4" />
                    Complete
                  </Button>
                )}
              </TableCell>
            </TableRow>
          )}
          renderMobileCard={(appointment) => (
            <AppCard className="border-border/70 bg-white/70 shadow-sm">
              <AppCardHeader className="px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <AppCardTitle className="text-lg">{appointment.patient_name}</AppCardTitle>
                    <AppCardDescription>
                      {appointment.provider_name} · {formatDateTime(appointment.scheduled_at)}
                    </AppCardDescription>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              </AppCardHeader>
              <AppCardContent className="space-y-4 px-5 pb-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Payer
                    </p>
                    <p className="mt-1 text-sm text-foreground">{appointment.payer_name}</p>
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Billing
                    </p>
                    <StatusBadge status={appointment.billing_status} className="mt-1" />
                  </div>
                </div>
                {appointment.status !== "completed" || appointment.billing_status === "claimed" ? null : (
                  <Button className="w-full" type="button" onClick={() => controller.appointments.complete(appointment)}>
                    Convert to draft claim
                  </Button>
                )}
              </AppCardContent>
            </AppCard>
          )}
          emptyMessage="No appointments logged yet."
          emptyDetail="Create an appointment to start driving billing work from completed visits."
        />
      </Section>
    </div>
  );
}
