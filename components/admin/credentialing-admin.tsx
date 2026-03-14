"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Section } from "@/components/system/section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/workspace/shared/status-badge";
import type { CredentialingSummary } from "@/lib/services/credentialing";
import type { Database } from "@/types/database";
import { formatDate } from "@/components/workspace/workspace-utils";

type CredentialingAdminProps = {
  records: CredentialingSummary[];
  providers: Database["public"]["Tables"]["providers"]["Row"][];
  payers: Database["public"]["Tables"]["payers"]["Row"][];
};

export function CredentialingAdmin({
  records,
  providers,
  payers,
}: CredentialingAdminProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    provider_id: "",
    payer_id: "",
    status: "pending",
    submitted_at: "",
    approved_at: "",
    expiry_date: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch("/api/credentialing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider_id: form.provider_id,
        payer_id: form.payer_id,
        status: form.status,
        submitted_at: form.submitted_at ? new Date(form.submitted_at).toISOString() : null,
        approved_at: form.approved_at ? new Date(form.approved_at).toISOString() : null,
        expiry_date: form.expiry_date || null,
        notes: form.notes.trim() || null,
      }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as
        | { error?: string; details?: string[] }
        | null;
      setError(
        [result?.error ?? "Unable to save credentialing.", ...(result?.details ?? [])]
          .filter(Boolean)
          .join(" ")
      );
      return;
    }

    setForm({
      provider_id: "",
      payer_id: "",
      status: "pending",
      submitted_at: "",
      approved_at: "",
      expiry_date: "",
      notes: "",
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Credentialing error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Section
          eyebrow="Credentialing"
          title="Update status"
          description="Track enrollment per provider and payer."
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <select
              className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              value={form.provider_id}
              onChange={(event) => setForm((current) => ({ ...current, provider_id: event.target.value }))}
              required
            >
              <option value="">Select provider</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.first_name} {provider.last_name}
                </option>
              ))}
            </select>
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
            <select
              className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="expired">Expired</option>
              <option value="denied">Denied</option>
            </select>
            <Input type="datetime-local" value={form.submitted_at} onChange={(event) => setForm((current) => ({ ...current, submitted_at: event.target.value }))} />
            <Input type="datetime-local" value={form.approved_at} onChange={(event) => setForm((current) => ({ ...current, approved_at: event.target.value }))} />
            <Input type="date" value={form.expiry_date} onChange={(event) => setForm((current) => ({ ...current, expiry_date: event.target.value }))} />
            <Textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={4} />
            <Button type="submit">Save credentialing</Button>
          </form>
        </Section>

        <Section
          eyebrow="Enrollment Grid"
          title="Credentialing status"
          description="Expiring credentials are highlighted automatically."
        >
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className={`rounded-[22px] border px-4 py-4 ${
                  record.is_expired
                    ? "border-rose-200 bg-rose-50"
                    : record.expires_soon
                      ? "border-amber-200 bg-amber-50"
                      : "border-border/70 bg-white/78"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-heading text-lg font-semibold text-foreground">
                      {record.provider_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{record.payer_name}</p>
                  </div>
                  <StatusBadge status={record.status} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Expiry: {formatDate(record.expiry_date)}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
