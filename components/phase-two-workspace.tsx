"use client";

import type { FormEvent } from "react";
import { useDeferredValue, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BadgeDollarSign,
  ClipboardList,
  FileWarning,
  Plus,
  ReceiptText,
  RefreshCw,
  Save,
  Trash2,
  UserRoundPlus,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

type PatientRow = PhaseTwoWorkspaceData["patients"][number];
type ClaimRow = PhaseTwoWorkspaceData["claims"][number];
type PaymentRow = PhaseTwoWorkspaceData["payments"][number];

type PhaseTwoWorkspaceProps = {
  data: PhaseTwoWorkspaceData;
  initialTab: string;
  paymentStatus: string | null;
  organizationName: string;
  userRole: string;
};

type FeedbackState = {
  tone: "success" | "error";
  title: string;
  message: string;
} | null;

type PatientFormState = {
  first_name: string;
  last_name: string;
  dob: string;
  insurance_id: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
};

type ProviderFormState = {
  npi: string;
  first_name: string;
  last_name: string;
  specialty: string;
};

type PayerFormState = {
  name: string;
  payer_id: string;
  contact_email: string;
  contact_phone: string;
};

type ClaimProcedureState = {
  cpt_code: string;
  description: string;
  units: string;
  charge_amount: string;
  allowed_amount: string;
};

type ClaimDiagnosisState = {
  icd10_code: string;
  description: string;
  sequence: string;
};

type ClaimFormState = {
  patient_id: string;
  provider_id: string;
  payer_id: string;
  procedures: ClaimProcedureState[];
  diagnoses: ClaimDiagnosisState[];
};

type PaymentFormState = {
  patient_id: string;
  claim_id: string;
  amount: string;
  description: string;
};

type DenialFormState = {
  claim_id: string;
  reason_code: string;
  reason_desc: string;
  appeal_deadline: string;
};

const TABS = ["patients", "claims", "payments", "denials"] as const;

const emptyPatientForm = (): PatientFormState => ({
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

const emptyProviderForm = (): ProviderFormState => ({
  npi: "",
  first_name: "",
  last_name: "",
  specialty: "",
});

const emptyPayerForm = (): PayerFormState => ({
  name: "",
  payer_id: "",
  contact_email: "",
  contact_phone: "",
});

const emptyProcedure = (): ClaimProcedureState => ({
  cpt_code: "",
  description: "",
  units: "1",
  charge_amount: "0.00",
  allowed_amount: "0.00",
});

const emptyDiagnosis = (sequence = 1): ClaimDiagnosisState => ({
  icd10_code: "",
  description: "",
  sequence: String(sequence),
});

const emptyClaimForm = (): ClaimFormState => ({
  patient_id: "",
  provider_id: "",
  payer_id: "",
  procedures: [emptyProcedure()],
  diagnoses: [emptyDiagnosis(1)],
});

const emptyPaymentForm = (): PaymentFormState => ({
  patient_id: "",
  claim_id: "",
  amount: "",
  description: "",
});

const emptyDenialForm = (): DenialFormState => ({
  claim_id: "",
  reason_code: "",
  reason_desc: "",
  appeal_deadline: "",
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getAddressFields(address: PatientRow["address"]) {
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

function buildPatientPayload(form: PatientFormState) {
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

function formatPatientAddress(patient: PatientRow) {
  const address = getAddressFields(patient.address);
  const pieces = [address.line1, address.city, address.state, address.zip].filter(
    Boolean
  );

  return pieces.length > 0 ? pieces.join(", ") : "No address";
}

function getStatusVariant(status: string) {
  if (status === "submitted" || status === "paid" || status === "success") {
    return "default";
  }

  if (status === "denied" || status === "open" || status === "cancelled") {
    return "destructive";
  }

  if (status === "pending" || status === "draft") {
    return "secondary";
  }

  return "outline";
}

async function requestJson<T>(
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
    | { data?: T; error?: string; url?: string; success?: boolean }
    | null;

  if (!response.ok) {
    throw new Error(result?.error ?? "Request failed.");
  }

  return {
    data: result?.data,
    url: result?.url,
    success: result?.success,
  };
}

export function PhaseTwoWorkspace({
  data,
  initialTab,
  paymentStatus,
  organizationName,
  userRole,
}: PhaseTwoWorkspaceProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState(
    TABS.includes(initialTab as (typeof TABS)[number]) ? initialTab : "patients"
  );
  const [feedback, setFeedback] = useState<FeedbackState>(
    paymentStatus === "success"
      ? {
          tone: "success",
          title: "Demo payment completed",
          message:
            "The dummy checkout flow completed and the payment queue was updated for the demo.",
        }
      : paymentStatus === "cancelled"
        ? {
            tone: "error",
            title: "Demo payment cancelled",
            message:
              "The dummy payment was cancelled. You can generate a fresh link from the Payments tab.",
          }
        : null
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const deferredPatientSearch = useDeferredValue(patientSearch);
  const [patientForm, setPatientForm] = useState<PatientFormState>(emptyPatientForm);
  const [providerForm, setProviderForm] = useState<ProviderFormState>(emptyProviderForm);
  const [payerForm, setPayerForm] = useState<PayerFormState>(emptyPayerForm);
  const [claimForm, setClaimForm] = useState<ClaimFormState>(emptyClaimForm);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(emptyPaymentForm);
  const [denialForm, setDenialForm] = useState<DenialFormState>(emptyDenialForm);
  const [latestPaymentLink, setLatestPaymentLink] = useState<string | null>(null);

  const query = deferredPatientSearch.trim().toLowerCase();
  const filteredPatients = !query
    ? data.patients
    : data.patients.filter((patient) => {
        const haystack = [
          patient.first_name,
          patient.last_name,
          patient.insurance_id ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      });

  const patientOptions = data.patients.map((patient) => ({
    id: patient.id,
    label: `${patient.first_name} ${patient.last_name}`.trim(),
  }));

  const claimOptions = data.claims.map((claim) => ({
    id: claim.id,
    label: `${claim.patient_name} · ${formatCurrency(claim.total_amount)} · ${claim.status}`,
  }));

  const operationsCount = {
    patients: data.patients.length,
    claims: data.claims.length,
    denials: data.denials.length,
    payments: data.payments.length,
  };

  function refreshWorkspace() {
    startTransition(() => {
      router.refresh();
    });
  }

  function clearFeedback() {
    setFeedback(null);
  }

  function hydratePatientForm(patient: PatientRow) {
    const address = getAddressFields(patient.address);

    setPatientForm({
      first_name: patient.first_name,
      last_name: patient.last_name,
      dob: patient.dob,
      insurance_id: patient.insurance_id ?? "",
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      zip: address.zip,
    });
    setEditingPatientId(patient.id);
    setActiveTab("patients");
  }

  async function handlePatientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setPendingAction(editingPatientId ? "save-patient" : "create-patient");

    try {
      const endpoint = editingPatientId
        ? `/api/patients/${editingPatientId}`
        : "/api/patients";
      const method = editingPatientId ? "PATCH" : "POST";

      await requestJson(endpoint, {
        method,
        body: JSON.stringify(buildPatientPayload(patientForm)),
      });

      setFeedback({
        tone: "success",
        title: editingPatientId ? "Patient updated" : "Patient created",
        message: editingPatientId
          ? "The patient record was saved successfully."
          : "The new patient is now available for claims and payments.",
      });
      setPatientForm(emptyPatientForm());
      setEditingPatientId(null);
      refreshWorkspace();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Patient save failed",
        message:
          error instanceof Error ? error.message : "Unable to save the patient.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handlePatientDelete(patient: PatientRow) {
    if (!window.confirm(`Delete patient ${patient.first_name} ${patient.last_name}?`)) {
      return;
    }

    clearFeedback();
    setPendingAction(`delete-patient-${patient.id}`);

    try {
      await requestJson(`/api/patients/${patient.id}`, {
        method: "DELETE",
      });

      setFeedback({
        tone: "success",
        title: "Patient deleted",
        message: "The patient record was removed.",
      });

      if (editingPatientId === patient.id) {
        setEditingPatientId(null);
        setPatientForm(emptyPatientForm());
      }

      refreshWorkspace();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Unable to delete patient",
        message:
          error instanceof Error ? error.message : "Delete request did not complete.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleProviderSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setPendingAction("create-provider");

    try {
      await requestJson("/api/providers", {
        method: "POST",
        body: JSON.stringify({
          npi: providerForm.npi.trim(),
          first_name: providerForm.first_name.trim(),
          last_name: providerForm.last_name.trim(),
          specialty: providerForm.specialty.trim() || null,
        }),
      });

      setProviderForm(emptyProviderForm());
      setFeedback({
        tone: "success",
        title: "Provider added",
        message: "The new rendering provider is now available in the claim form.",
      });
      refreshWorkspace();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Provider save failed",
        message:
          error instanceof Error ? error.message : "Unable to create provider.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handlePayerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setPendingAction("create-payer");

    try {
      await requestJson("/api/payers", {
        method: "POST",
        body: JSON.stringify({
          name: payerForm.name.trim(),
          payer_id: payerForm.payer_id.trim(),
          contact_email: payerForm.contact_email.trim() || null,
          contact_phone: payerForm.contact_phone.trim() || null,
        }),
      });

      setPayerForm(emptyPayerForm());
      setFeedback({
        tone: "success",
        title: "Payer added",
        message: "The payer is now available when drafting claims.",
      });
      refreshWorkspace();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Payer save failed",
        message:
          error instanceof Error ? error.message : "Unable to create payer.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleClaimSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setPendingAction("create-claim");

    try {
      await requestJson("/api/claims", {
        method: "POST",
        body: JSON.stringify({
          patient_id: claimForm.patient_id,
          provider_id: claimForm.provider_id,
          payer_id: claimForm.payer_id,
          procedures: claimForm.procedures.map((procedure) => ({
            cpt_code: procedure.cpt_code.trim(),
            description: procedure.description.trim() || null,
            units: Number(procedure.units),
            charge_amount: Number(procedure.charge_amount),
            allowed_amount: Number(procedure.allowed_amount),
          })),
          diagnoses: claimForm.diagnoses.map((diagnosis) => ({
            icd10_code: diagnosis.icd10_code.trim(),
            description: diagnosis.description.trim() || null,
            sequence: Number(diagnosis.sequence),
          })),
        }),
      });

      setClaimForm(emptyClaimForm());
      setFeedback({
        tone: "success",
        title: "Claim drafted",
        message: "The claim is saved as a draft and ready for submission.",
      });
      refreshWorkspace();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Claim creation failed",
        message:
          error instanceof Error ? error.message : "Unable to create claim.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleClaimSubmitAction(claim: ClaimRow) {
    clearFeedback();
    setPendingAction(`submit-claim-${claim.id}`);

    try {
      await requestJson(`/api/claims/${claim.id}/submit`, {
        method: "PATCH",
      });

      setFeedback({
        tone: "success",
        title: "Claim submitted",
        message: `Claim for ${claim.patient_name} was marked as submitted.`,
      });
      refreshWorkspace();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Claim submission failed",
        message:
          error instanceof Error ? error.message : "Unable to submit claim.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setPendingAction("create-payment-link");

    try {
      const result = await requestJson<PaymentRow>("/api/payments/link", {
        method: "POST",
        body: JSON.stringify({
          patient_id: paymentForm.patient_id,
          claim_id: paymentForm.claim_id || null,
          amount: Number(paymentForm.amount),
          description: paymentForm.description.trim(),
        }),
      });

      setLatestPaymentLink(result.url ?? null);
      setPaymentForm(emptyPaymentForm());
      setFeedback({
        tone: "success",
        title: "Demo payment link created",
        message:
          "The demo checkout link is ready. Open it to simulate a successful or cancelled payment.",
      });
      refreshWorkspace();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Payment link failed",
        message:
          error instanceof Error
            ? error.message
            : "Unable to create the checkout link.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDenialSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setPendingAction("create-denial");

    try {
      await requestJson("/api/denials", {
        method: "POST",
        body: JSON.stringify({
          claim_id: denialForm.claim_id,
          reason_code: denialForm.reason_code.trim(),
          reason_desc: denialForm.reason_desc.trim(),
          appeal_deadline: denialForm.appeal_deadline || null,
        }),
      });

      setDenialForm(emptyDenialForm());
      setFeedback({
        tone: "success",
        title: "Denial logged",
        message: "The denial was recorded and the related claim is now marked denied.",
      });
      refreshWorkspace();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Denial logging failed",
        message:
          error instanceof Error ? error.message : "Unable to log denial.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  const claimDraftTotal = claimForm.procedures.reduce((sum, procedure) => {
    const units = Number(procedure.units) || 0;
    const chargeAmount = Number(procedure.charge_amount) || 0;

    return sum + units * chargeAmount;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="border-white/80 bg-white/90 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-emerald-700" />
              Workspace
            </CardTitle>
            <CardDescription>
              Operational phase for {organizationName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-slate-700">
            <p className="font-medium text-slate-950">{userRole}</p>
            <p>manual entry only</p>
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/90 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRoundPlus className="size-4 text-sky-700" />
              Patients
            </CardTitle>
            <CardDescription>Captured and ready for billing.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-950">
              {operationsCount.patients}
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/90 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-amber-700" />
              Claims
            </CardTitle>
            <CardDescription>Drafts plus submitted claims.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-950">
              {operationsCount.claims}
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/90 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileWarning className="size-4 text-rose-700" />
              Denials
            </CardTitle>
            <CardDescription>Manual denial capture queue.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-950">
              {operationsCount.denials}
            </p>
          </CardContent>
        </Card>
      </div>

      {feedback ? (
        <Alert variant={feedback.tone === "error" ? "destructive" : "default"}>
          <AlertTitle>{feedback.title}</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      ) : null}

      {data.providers.length === 0 || data.payers.length === 0 ? (
        <Alert>
          <AlertTitle>Claim setup still needs master data</AlertTitle>
          <AlertDescription>
            Add at least one provider and one payer in the Claims tab before
            submitting your first claim.
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value)}
        className="space-y-4"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList variant="line">
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="denials">Denials</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            type="button"
            onClick={refreshWorkspace}
            disabled={isRefreshing || pendingAction !== null}
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>

        <TabsContent value="patients" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_1.45fr]">
            <Card className="border-white/80 bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle>
                  {editingPatientId ? "Edit patient" : "New patient intake"}
                </CardTitle>
                <CardDescription>
                  Capture demographics for manual claim entry.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handlePatientSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="patient-first-name">First name</Label>
                      <Input
                        id="patient-first-name"
                        value={patientForm.first_name}
                        onChange={(event) =>
                          setPatientForm((current) => ({
                            ...current,
                            first_name: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-last-name">Last name</Label>
                      <Input
                        id="patient-last-name"
                        value={patientForm.last_name}
                        onChange={(event) =>
                          setPatientForm((current) => ({
                            ...current,
                            last_name: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-dob">Date of birth</Label>
                      <Input
                        id="patient-dob"
                        type="date"
                        value={patientForm.dob}
                        onChange={(event) =>
                          setPatientForm((current) => ({
                            ...current,
                            dob: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-insurance-id">Insurance ID</Label>
                      <Input
                        id="patient-insurance-id"
                        value={patientForm.insurance_id}
                        onChange={(event) =>
                          setPatientForm((current) => ({
                            ...current,
                            insurance_id: event.target.value,
                          }))
                        }
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="patient-line1">Address line 1</Label>
                      <Input
                        id="patient-line1"
                        value={patientForm.line1}
                        onChange={(event) =>
                          setPatientForm((current) => ({
                            ...current,
                            line1: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="patient-line2">Address line 2</Label>
                      <Input
                        id="patient-line2"
                        value={patientForm.line2}
                        onChange={(event) =>
                          setPatientForm((current) => ({
                            ...current,
                            line2: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-city">City</Label>
                      <Input
                        id="patient-city"
                        value={patientForm.city}
                        onChange={(event) =>
                          setPatientForm((current) => ({
                            ...current,
                            city: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="patient-state">State</Label>
                        <Input
                          id="patient-state"
                          maxLength={2}
                          value={patientForm.state}
                          onChange={(event) =>
                            setPatientForm((current) => ({
                              ...current,
                              state: event.target.value.toUpperCase(),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="patient-zip">ZIP</Label>
                        <Input
                          id="patient-zip"
                          value={patientForm.zip}
                          onChange={(event) =>
                            setPatientForm((current) => ({
                              ...current,
                              zip: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={pendingAction !== null}>
                      <Save className="size-4" />
                      {editingPatientId ? "Save patient" : "Create patient"}
                    </Button>
                    {editingPatientId ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingPatientId(null);
                          setPatientForm(emptyPatientForm());
                        }}
                        disabled={pendingAction !== null}
                      >
                        Reset form
                      </Button>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-white/80 bg-white/90 backdrop-blur">
              <CardHeader className="gap-3 md:flex md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle>Patient roster</CardTitle>
                  <CardDescription>
                    Update or delete existing patient records.
                  </CardDescription>
                </div>
                <div className="w-full md:max-w-xs">
                  <Label htmlFor="patient-search" className="sr-only">
                    Search patients
                  </Label>
                  <Input
                    id="patient-search"
                    placeholder="Search patient or insurance ID"
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Insurance</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
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
                                onClick={() => hydratePatientForm(patient)}
                                disabled={pendingAction !== null}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => handlePatientDelete(patient)}
                                disabled={pendingAction !== null}
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                          No patients match the current search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <Card className="border-white/80 bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle>Claim draft builder</CardTitle>
                <CardDescription>
                  Manual claim intake with procedure and diagnosis rows.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={handleClaimSubmit}>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Patient</Label>
                      <Select
                        value={claimForm.patient_id}
                        onValueChange={(value) =>
                          setClaimForm((current) => ({
                            ...current,
                            patient_id: value ?? "",
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patientOptions.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <Select
                        value={claimForm.provider_id}
                        onValueChange={(value) =>
                          setClaimForm((current) => ({
                            ...current,
                            provider_id: value ?? "",
                          }))
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
                    </div>
                    <div className="space-y-2">
                      <Label>Payer</Label>
                      <Select
                        value={claimForm.payer_id}
                        onValueChange={(value) =>
                          setClaimForm((current) => ({
                            ...current,
                            payer_id: value ?? "",
                          }))
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
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-950">Procedures</p>
                        <p className="text-sm text-slate-600">
                          At least one CPT line is required.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setClaimForm((current) => ({
                            ...current,
                            procedures: [...current.procedures, emptyProcedure()],
                          }))
                        }
                        disabled={pendingAction !== null}
                      >
                        <Plus className="size-4" />
                        Add procedure
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {claimForm.procedures.map((procedure, index) => (
                        <div
                          key={`procedure-${index}`}
                          className="rounded-xl border border-slate-200/80 p-4"
                        >
                          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr_0.55fr_0.7fr_0.7fr_auto]">
                            <div className="space-y-2">
                              <Label>CPT code</Label>
                              <Input
                                value={procedure.cpt_code}
                                onChange={(event) =>
                                  setClaimForm((current) => ({
                                    ...current,
                                    procedures: current.procedures.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, cpt_code: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Input
                                value={procedure.description}
                                onChange={(event) =>
                                  setClaimForm((current) => ({
                                    ...current,
                                    procedures: current.procedures.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, description: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Units</Label>
                              <Input
                                type="number"
                                min={1}
                                value={procedure.units}
                                onChange={(event) =>
                                  setClaimForm((current) => ({
                                    ...current,
                                    procedures: current.procedures.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, units: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Charge</Label>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={procedure.charge_amount}
                                onChange={(event) =>
                                  setClaimForm((current) => ({
                                    ...current,
                                    procedures: current.procedures.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, charge_amount: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Allowed</Label>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={procedure.allowed_amount}
                                onChange={(event) =>
                                  setClaimForm((current) => ({
                                    ...current,
                                    procedures: current.procedures.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, allowed_amount: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                                required
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                  setClaimForm((current) => ({
                                    ...current,
                                    procedures:
                                      current.procedures.length > 1
                                        ? current.procedures.filter((_, itemIndex) => itemIndex !== index)
                                        : current.procedures,
                                  }))
                                }
                                disabled={pendingAction !== null || claimForm.procedures.length === 1}
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
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-950">Diagnoses</p>
                        <p className="text-sm text-slate-600">
                          At least one ICD-10 code is required.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setClaimForm((current) => ({
                            ...current,
                            diagnoses: [
                              ...current.diagnoses,
                              emptyDiagnosis(current.diagnoses.length + 1),
                            ],
                          }))
                        }
                        disabled={pendingAction !== null}
                      >
                        <Plus className="size-4" />
                        Add diagnosis
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {claimForm.diagnoses.map((diagnosis, index) => (
                        <div
                          key={`diagnosis-${index}`}
                          className="rounded-xl border border-slate-200/80 p-4"
                        >
                          <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr_0.55fr_auto]">
                            <div className="space-y-2">
                              <Label>ICD-10 code</Label>
                              <Input
                                value={diagnosis.icd10_code}
                                onChange={(event) =>
                                  setClaimForm((current) => ({
                                    ...current,
                                    diagnoses: current.diagnoses.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, icd10_code: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Input
                                value={diagnosis.description}
                                onChange={(event) =>
                                  setClaimForm((current) => ({
                                    ...current,
                                    diagnoses: current.diagnoses.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, description: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Sequence</Label>
                              <Input
                                type="number"
                                min={1}
                                value={diagnosis.sequence}
                                onChange={(event) =>
                                  setClaimForm((current) => ({
                                    ...current,
                                    diagnoses: current.diagnoses.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, sequence: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                                required
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                  setClaimForm((current) => ({
                                    ...current,
                                    diagnoses:
                                      current.diagnoses.length > 1
                                        ? current.diagnoses
                                            .filter((_, itemIndex) => itemIndex !== index)
                                            .map((item, itemIndex) => ({
                                              ...item,
                                              sequence: String(itemIndex + 1),
                                            }))
                                        : current.diagnoses,
                                  }))
                                }
                                disabled={pendingAction !== null || claimForm.diagnoses.length === 1}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm text-slate-600">Draft total</p>
                      <p className="text-xl font-semibold text-slate-950">
                        {formatCurrency(claimDraftTotal)}
                      </p>
                    </div>
                    <Button type="submit" disabled={pendingAction !== null}>
                      <ReceiptText className="size-4" />
                      Save draft claim
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-white/80 bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle>Provider quick add</CardTitle>
                  <CardDescription>
                    Keep setup inside the claim workflow.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleProviderSubmit}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="provider-first-name">First name</Label>
                        <Input
                          id="provider-first-name"
                          value={providerForm.first_name}
                          onChange={(event) =>
                            setProviderForm((current) => ({
                              ...current,
                              first_name: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provider-last-name">Last name</Label>
                        <Input
                          id="provider-last-name"
                          value={providerForm.last_name}
                          onChange={(event) =>
                            setProviderForm((current) => ({
                              ...current,
                              last_name: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provider-npi">NPI</Label>
                        <Input
                          id="provider-npi"
                          value={providerForm.npi}
                          onChange={(event) =>
                            setProviderForm((current) => ({
                              ...current,
                              npi: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provider-specialty">Specialty</Label>
                        <Input
                          id="provider-specialty"
                          value={providerForm.specialty}
                          onChange={(event) =>
                            setProviderForm((current) => ({
                              ...current,
                              specialty: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={pendingAction !== null}>
                      Save provider
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-white/80 bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle>Payer quick add</CardTitle>
                  <CardDescription>
                    Manual entry only, no clearinghouse integration.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handlePayerSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="payer-name">Payer name</Label>
                      <Input
                        id="payer-name"
                        value={payerForm.name}
                        onChange={(event) =>
                          setPayerForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payer-id">Payer ID</Label>
                      <Input
                        id="payer-id"
                        value={payerForm.payer_id}
                        onChange={(event) =>
                          setPayerForm((current) => ({
                            ...current,
                            payer_id: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="payer-email">Contact email</Label>
                        <Input
                          id="payer-email"
                          type="email"
                          value={payerForm.contact_email}
                          onChange={(event) =>
                            setPayerForm((current) => ({
                              ...current,
                              contact_email: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payer-phone">Contact phone</Label>
                        <Input
                          id="payer-phone"
                          value={payerForm.contact_phone}
                          onChange={(event) =>
                            setPayerForm((current) => ({
                              ...current,
                              contact_phone: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={pendingAction !== null}>
                      Save payer
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-white/80 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>Claims queue</CardTitle>
              <CardDescription>
                Draft and submitted claims for the current org.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.claims.length > 0 ? (
                    data.claims.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium text-slate-950">
                          {claim.patient_name}
                        </TableCell>
                        <TableCell>{claim.provider_name}</TableCell>
                        <TableCell>{claim.payer_name}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(claim.status)}>
                            {claim.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(claim.total_amount)}</TableCell>
                        <TableCell>{formatDateTime(claim.submitted_at)}</TableCell>
                        <TableCell className="text-right">
                          {claim.status === "draft" ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleClaimSubmitAction(claim)}
                              disabled={pendingAction !== null}
                            >
                              Submit
                            </Button>
                          ) : (
                            <span className="text-sm text-slate-500">
                              No action
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                        No claims created yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-white/80 bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle>Demo payment link</CardTitle>
                <CardDescription>
                  Generate an internal demo checkout URL for hackathon patient payment flows.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form className="space-y-4" onSubmit={handlePaymentSubmit}>
                  <div className="space-y-2">
                    <Label>Patient</Label>
                    <Select
                      value={paymentForm.patient_id}
                      onValueChange={(value) =>
                        setPaymentForm((current) => ({
                          ...current,
                          patient_id: value ?? "",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patientOptions.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Related claim</Label>
                    <Select
                      value={paymentForm.claim_id || "__none__"}
                      onValueChange={(value) =>
                        setPaymentForm((current) => ({
                          ...current,
                          claim_id: value === "__none__" ? "" : value ?? "",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Optional claim" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No claim</SelectItem>
                        {claimOptions.map((claim) => (
                          <SelectItem key={claim.id} value={claim.id}>
                            {claim.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="payment-amount">Amount</Label>
                      <Input
                        id="payment-amount"
                        type="number"
                        step="0.01"
                        min={0.01}
                        value={paymentForm.amount}
                        onChange={(event) =>
                          setPaymentForm((current) => ({
                            ...current,
                            amount: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-description">Description</Label>
                      <Input
                        id="payment-description"
                        value={paymentForm.description}
                        onChange={(event) =>
                          setPaymentForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={pendingAction !== null}>
                    <BadgeDollarSign className="size-4" />
                    Create payment link
                  </Button>
                </form>

                {latestPaymentLink ? (
                  <Alert>
                    <AlertTitle>Checkout link ready</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-3">
                        <p className="break-all text-sm">{latestPaymentLink}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            onClick={() =>
                              window.open(latestPaymentLink, "_blank", "noopener,noreferrer")
                            }
                          >
                            Open demo checkout
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                              await navigator.clipboard.writeText(latestPaymentLink);
                              setFeedback({
                                tone: "success",
                                title: "Payment link copied",
                                message: "The demo checkout URL is on your clipboard.",
                              });
                            }}
                          >
                            Copy link
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-white/80 bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle>Payment records</CardTitle>
                <CardDescription>
                  Pending and completed patient payment attempts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.payments.length > 0 ? (
                      data.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium text-slate-950">
                            {payment.patient_name}
                          </TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(payment.status)}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell>{formatDateTime(payment.created_at)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                          No payment links generated yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="denials" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-white/80 bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle>Log denial</CardTitle>
                <CardDescription>
                  Capture payer feedback and mark the claim as denied.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleDenialSubmit}>
                  <div className="space-y-2">
                    <Label>Claim</Label>
                    <Select
                      value={denialForm.claim_id}
                      onValueChange={(value) =>
                        setDenialForm((current) => ({
                          ...current,
                          claim_id: value ?? "",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select claim" />
                      </SelectTrigger>
                      <SelectContent>
                        {claimOptions.map((claim) => (
                          <SelectItem key={claim.id} value={claim.id}>
                            {claim.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="denial-reason-code">Reason code</Label>
                      <Input
                        id="denial-reason-code"
                        value={denialForm.reason_code}
                        onChange={(event) =>
                          setDenialForm((current) => ({
                            ...current,
                            reason_code: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="denial-appeal-deadline">Appeal deadline</Label>
                      <Input
                        id="denial-appeal-deadline"
                        type="date"
                        value={denialForm.appeal_deadline}
                        onChange={(event) =>
                          setDenialForm((current) => ({
                            ...current,
                            appeal_deadline: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="denial-reason-desc">Reason description</Label>
                    <Textarea
                      id="denial-reason-desc"
                      value={denialForm.reason_desc}
                      onChange={(event) =>
                        setDenialForm((current) => ({
                          ...current,
                          reason_desc: event.target.value,
                        }))
                      }
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={pendingAction !== null}>
                    Save denial
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-white/80 bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle>Denial log</CardTitle>
                <CardDescription>
                  Open denials captured for follow-up and appeal tracking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reason code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Claim status</TableHead>
                      <TableHead>Appeal deadline</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.denials.length > 0 ? (
                      data.denials.map((denial) => (
                        <TableRow key={denial.id}>
                          <TableCell className="font-medium text-slate-950">
                            {denial.reason_code}
                          </TableCell>
                          <TableCell className="max-w-md whitespace-normal">
                            {denial.reason_desc}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(denial.claim_status)}>
                              {denial.claim_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {denial.appeal_deadline
                              ? formatDate(denial.appeal_deadline)
                              : "Not set"}
                          </TableCell>
                          <TableCell>{formatDateTime(denial.created_at)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                          No denials logged yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
