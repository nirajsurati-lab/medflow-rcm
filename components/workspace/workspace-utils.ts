import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

import type {
  ClaimDiagnosisState,
  ClaimFormState,
  ClaimProcedureState,
  PatientFormState,
  PatientRow,
  PaymentFormState,
  PayerFormState,
  ProviderFormState,
  DenialFormState,
} from "@/components/workspace/types";

export const emptyPatientForm = (): PatientFormState => ({
  first_name: "",
  last_name: "",
  dob: "",
  insurance_id: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
});

export const emptyProviderForm = (): ProviderFormState => ({
  npi: "",
  first_name: "",
  last_name: "",
  specialty: "",
});

export const emptyPayerForm = (): PayerFormState => ({
  name: "",
  payer_id: "",
  contact_email: "",
  contact_phone: "",
});

export const emptyProcedure = (): ClaimProcedureState => ({
  cpt_code: "",
  description: "",
  units: "1",
  charge_amount: "0.00",
  allowed_amount: "0.00",
});

export const emptyDiagnosis = (sequence = 1): ClaimDiagnosisState => ({
  icd10_code: "",
  description: "",
  sequence: String(sequence),
});

export const emptyClaimForm = (): ClaimFormState => ({
  patient_id: "",
  provider_id: "",
  payer_id: "",
  procedures: [emptyProcedure()],
  diagnoses: [emptyDiagnosis(1)],
});

export const emptyPaymentForm = (): PaymentFormState => ({
  patient_id: "",
  claim_id: "",
  amount: "",
  description: "",
});

export const emptyDenialForm = (): DenialFormState => ({
  claim_id: "",
  reason_code: "",
  reason_desc: "",
  appeal_deadline: "",
});

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatMetricValue(
  metric: PhaseTwoWorkspaceData["dashboard"]["kpis"][number]
) {
  if (metric.kind === "currency") {
    return formatCurrency(metric.value);
  }

  if (metric.kind === "percent") {
    return `${metric.value.toFixed(1)}%`;
  }

  return new Intl.NumberFormat("en-US").format(metric.value);
}

export function getAddressFields(address: PatientRow["address"]) {
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    return {
      line1: "",
      line2: "",
      city: "",
      state: "",
      zip: "",
    };
  }

  const record = address as Record<string, unknown>;

  return {
    line1: typeof record.line1 === "string" ? record.line1 : "",
    line2: typeof record.line2 === "string" ? record.line2 : "",
    city: typeof record.city === "string" ? record.city : "",
    state: typeof record.state === "string" ? record.state : "",
    zip: typeof record.zip === "string" ? record.zip : "",
  };
}

export function buildPatientPayload(form: PatientFormState) {
  const hasAddress =
    form.line1 || form.line2 || form.city || form.state || form.zip;

  return {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    dob: form.dob,
    insurance_id: form.insurance_id.trim() || null,
    address: hasAddress
      ? {
          line1: form.line1.trim(),
          line2: form.line2.trim() || undefined,
          city: form.city.trim(),
          state: form.state.trim().toUpperCase(),
          zip: form.zip.trim(),
        }
      : null,
  };
}

export function formatPatientAddress(patient: PatientRow) {
  const address = getAddressFields(patient.address);
  const pieces = [address.line1, address.city, address.state, address.zip].filter(
    Boolean
  );

  return pieces.length > 0 ? pieces.join(", ") : "No address";
}

export function getStatusVariant(status: string) {
  if (
    status === "submitted" ||
    status === "paid" ||
    status === "success" ||
    status === "succeeded"
  ) {
    return "default" as const;
  }

  if (
    status === "denied" ||
    status === "open" ||
    status === "cancelled" ||
    status === "voided" ||
    status === "failed"
  ) {
    return "destructive" as const;
  }

  if (status === "pending" || status === "draft") {
    return "secondary" as const;
  }

  return "outline" as const;
}

export function formatStatusLabel(status: string) {
  const replacements: Record<string, string> = {
    succeeded: "Completed",
    voided: "Cancelled",
    paid: "Paid",
    submitted: "Submitted",
    denied: "Denied",
    pending: "Pending",
    draft: "Draft",
    open: "Open",
    resolved: "Resolved",
    failed: "Failed",
    refunded: "Refunded",
    appealed: "Appealed",
    accepted: "Accepted",
    rejected: "Rejected",
    validated: "Validated",
  };

  return (
    replacements[status] ??
    status
      .split("_")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ")
  );
}

export function formatPaymentMethod(method: string) {
  if (method === "other") {
    return "Demo checkout";
  }

  return formatStatusLabel(method);
}

export async function requestJson<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<{ data?: T; url?: string; success?: boolean }> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const result = (await response.json().catch(() => null)) as
    | {
        data?: T;
        error?: string;
        details?: string[];
        url?: string;
        success?: boolean;
      }
    | null;

  if (!response.ok) {
    throw new Error(
      [result?.error ?? "Request failed.", ...(result?.details ?? [])]
        .filter(Boolean)
        .join(" ")
    );
  }

  return {
    data: result?.data,
    url: result?.url,
    success: result?.success,
  };
}
