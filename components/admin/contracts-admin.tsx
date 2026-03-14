"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/components/system/card";
import { FormField } from "@/components/system/form-field";
import { Section } from "@/components/system/section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FeeScheduleSummary } from "@/lib/services/contracts";
import type { Database } from "@/types/database";
import { formatCurrency, formatDate } from "@/components/workspace/workspace-utils";

type ContractsAdminProps = {
  payers: Database["public"]["Tables"]["payers"]["Row"][];
  feeSchedules: FeeScheduleSummary[];
};

export function ContractsAdmin({ payers, feeSchedules }: ContractsAdminProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    payer_id: "",
    cpt_code: "",
    allowed_amount: "",
    effective_date: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/contracts/fee-schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payer_id: form.payer_id,
        cpt_code: form.cpt_code.trim().toUpperCase(),
        allowed_amount: Number(form.allowed_amount),
        effective_date: form.effective_date,
      }),
    });
    const result = (await response.json().catch(() => null)) as
      | { error?: string; details?: string[] }
      | null;

    if (!response.ok) {
      setError(
        [result?.error ?? "Unable to create fee schedule.", ...(result?.details ?? [])]
          .filter(Boolean)
          .join(" ")
      );
      return;
    }

    setForm({
      payer_id: "",
      cpt_code: "",
      allowed_amount: "",
      effective_date: "",
    });
    setSuccess("Fee schedule added.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Save failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert>
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Section
          eyebrow="Contract Setup"
          title="Add fee schedule entry"
          description="Manual payer contract setup for expected reimbursement lookup."
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField label="Payer">
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={form.payer_id}
                onChange={(event) => setForm((current) => ({ ...current, payer_id: event.target.value }))}
                required
              >
                <option value="">Select payer</option>
                {payers.map((payer) => (
                  <option key={payer.id} value={payer.id}>
                    {payer.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="CPT code">
              <Input
                value={form.cpt_code}
                onChange={(event) => setForm((current) => ({ ...current, cpt_code: event.target.value }))}
                required
              />
            </FormField>
            <FormField label="Allowed amount">
              <Input
                type="number"
                step="0.01"
                min={0}
                value={form.allowed_amount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, allowed_amount: event.target.value }))
                }
                required
              />
            </FormField>
            <FormField label="Effective date">
              <Input
                type="date"
                value={form.effective_date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, effective_date: event.target.value }))
                }
                required
              />
            </FormField>
            <Button type="submit">Save fee schedule</Button>
          </form>
        </Section>

        <Section
          eyebrow="Fee Schedule"
          title="Current contract matrix"
          description="Allowed amounts by payer, CPT, and effective date."
        >
          <div className="space-y-3">
            {feeSchedules.map((item) => (
              <AppCard key={item.id} className="border-border/70 bg-white/78">
                <AppCardHeader className="px-5 py-5">
                  <AppCardTitle className="text-lg">{item.payer_name}</AppCardTitle>
                  <AppCardDescription>
                    CPT {item.cpt_code} · Effective {formatDate(item.effective_date)}
                  </AppCardDescription>
                </AppCardHeader>
                <AppCardContent className="px-5 pb-5">
                  <p className="font-heading text-2xl font-semibold text-foreground">
                    {formatCurrency(item.allowed_amount)}
                  </p>
                </AppCardContent>
              </AppCard>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
