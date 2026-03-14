"use client";

import type { FormEvent } from "react";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type {
  ClaimDiagnosisState,
  ClaimProcedureState,
  ClaimRow,
  PatientRow,
  PhaseTwoWorkspaceProps,
  ProviderFormState,
  WorkspaceController,
  WorkspaceTab,
  PayerFormState,
  PatientFormState,
  PaymentFormState,
  DenialFormState,
} from "@/components/workspace/types";
import {
  ALL_WORKSPACE_TABS,
  WORKSPACE_TAB_META,
} from "@/components/workspace/types";
import {
  buildPatientPayload,
  emptyClaimForm,
  emptyDenialForm,
  emptyDiagnosis,
  emptyPatientForm,
  emptyPayerForm,
  emptyPaymentForm,
  emptyProcedure,
  emptyProviderForm,
  formatCurrency,
  formatStatusLabel,
  getAddressFields,
  requestJson,
} from "@/components/workspace/workspace-utils";

function getInitialFeedback(paymentStatus: string | null) {
  if (paymentStatus === "success") {
    return {
      tone: "success" as const,
      title: "Demo payment completed",
      message:
        "The dummy checkout flow completed and the payment queue was updated for the demo.",
    };
  }

  if (paymentStatus === "cancelled") {
    return {
      tone: "error" as const,
      title: "Demo payment cancelled",
      message:
        "The dummy payment was cancelled. You can generate a fresh link from the Payments tab.",
    };
  }

  return null;
}

export function useWorkspaceController({
  data,
  initialTab,
  paymentStatus,
  userRole,
}: Pick<PhaseTwoWorkspaceProps, "data" | "initialTab" | "paymentStatus" | "userRole">): WorkspaceController {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const visibleTabs: readonly WorkspaceTab[] =
    userRole === "admin"
      ? ALL_WORKSPACE_TABS
      : ALL_WORKSPACE_TABS.filter((tab) => tab !== "audit");
  const safeInitialTab = visibleTabs.includes(initialTab as WorkspaceTab)
    ? (initialTab as WorkspaceTab)
    : "dashboard";

  const [activeTab, setActiveTabState] = useState<WorkspaceTab>(safeInitialTab);
  const [feedback, setFeedback] = useState(getInitialFeedback(paymentStatus));
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const deferredPatientSearch = useDeferredValue(patientSearch);
  const [patientForm, setPatientForm] = useState(emptyPatientForm);
  const [providerForm, setProviderForm] = useState(emptyProviderForm);
  const [payerForm, setPayerForm] = useState(emptyPayerForm);
  const [claimForm, setClaimForm] = useState(emptyClaimForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [denialForm, setDenialForm] = useState(emptyDenialForm);
  const [latestPaymentLink, setLatestPaymentLink] = useState<string | null>(null);
  const [selectedAuditLogId, setSelectedAuditLogId] = useState<string | null>(
    data.audit_logs[0]?.id ?? null
  );

  useEffect(() => {
    setActiveTabState(safeInitialTab);
  }, [safeInitialTab]);

  useEffect(() => {
    setFeedback(getInitialFeedback(paymentStatus));
  }, [paymentStatus]);

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
    label: `${claim.patient_name} · ${formatCurrency(claim.total_amount)} · ${formatStatusLabel(
      claim.status
    )}`,
  }));

  const queuePreview = data.dashboard.claims_queue.slice(0, 3);
  const selectedAuditLog =
    data.audit_logs.find((log) => log.id === selectedAuditLogId) ??
    data.audit_logs[0] ??
    null;
  const quickNavItems = visibleTabs
    .filter((tab) => tab !== "dashboard")
    .map((tab) => ({
      tab,
      title: WORKSPACE_TAB_META[tab].label,
      description: WORKSPACE_TAB_META[tab].description,
      icon: WORKSPACE_TAB_META[tab].icon,
    }));

  function refreshWorkspace() {
    startTransition(() => {
      router.refresh();
    });
  }

  function clearFeedback() {
    setFeedback(null);
  }

  function setActiveTab(tab: string) {
    if (visibleTabs.includes(tab as WorkspaceTab)) {
      setActiveTabState(tab as WorkspaceTab);
    }
  }

  function updatePatientField(field: keyof PatientFormState, value: string) {
    setPatientForm((current) => ({
      ...current,
      [field]:
        field === "state" ? value.toUpperCase() : value,
    }));
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
    setActiveTabState("patients");
  }

  function resetPatientForm() {
    setEditingPatientId(null);
    setPatientForm(emptyPatientForm());
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
      resetPatientForm();
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
        resetPatientForm();
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

  function updateProviderField(field: keyof ProviderFormState, value: string) {
    setProviderForm((current) => ({
      ...current,
      [field]: value,
    }));
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

  function updatePayerField(field: keyof PayerFormState, value: string) {
    setPayerForm((current) => ({
      ...current,
      [field]: value,
    }));
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

  function updateClaimField(
    field: "patient_id" | "provider_id" | "payer_id",
    value: string
  ) {
    setClaimForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateProcedureField(
    index: number,
    field: keyof ClaimProcedureState,
    value: string
  ) {
    setClaimForm((current) => ({
      ...current,
      procedures: current.procedures.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addProcedure() {
    setClaimForm((current) => ({
      ...current,
      procedures: [...current.procedures, emptyProcedure()],
    }));
  }

  function removeProcedure(index: number) {
    setClaimForm((current) => ({
      ...current,
      procedures:
        current.procedures.length > 1
          ? current.procedures.filter((_, itemIndex) => itemIndex !== index)
          : current.procedures,
    }));
  }

  function updateDiagnosisField(
    index: number,
    field: keyof ClaimDiagnosisState,
    value: string
  ) {
    setClaimForm((current) => ({
      ...current,
      diagnoses: current.diagnoses.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addDiagnosis() {
    setClaimForm((current) => ({
      ...current,
      diagnoses: [
        ...current.diagnoses,
        emptyDiagnosis(current.diagnoses.length + 1),
      ],
    }));
  }

  function removeDiagnosis(index: number) {
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
    }));
  }

  async function handleClaimDraftSubmit(event: FormEvent<HTMLFormElement>) {
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

  function updatePaymentField(field: keyof PaymentFormState, value: string) {
    setPaymentForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setPendingAction("create-payment-link");

    try {
      const result = await requestJson("/api/payments/link", {
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

  async function openLatestLink() {
    if (!latestPaymentLink) {
      return;
    }

    window.open(latestPaymentLink, "_blank", "noopener,noreferrer");
  }

  async function copyLatestLink() {
    if (!latestPaymentLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(latestPaymentLink);
      setFeedback({
        tone: "success",
        title: "Payment link copied",
        message: "The demo checkout URL is on your clipboard.",
      });
    } catch {
      setFeedback({
        tone: "error",
        title: "Copy failed",
        message:
          "Clipboard access was blocked. Open the demo checkout directly instead.",
      });
    }
  }

  function updateDenialField(field: keyof DenialFormState, value: string) {
    setDenialForm((current) => ({
      ...current,
      [field]: value,
    }));
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

  return {
    meta: {
      activeTab,
      visibleTabs,
      isRefreshing,
      pendingAction,
      feedback,
    },
    actions: {
      setActiveTab,
      refreshWorkspace,
      clearFeedback,
    },
    dashboard: {
      queuePreview,
      quickNavItems,
    },
    shared: {
      patientOptions,
      claimOptions,
    },
    patients: {
      editingPatientId,
      search: patientSearch,
      filtered: filteredPatients,
      form: patientForm,
      setSearch: setPatientSearch,
      updateField: updatePatientField,
      hydrate: hydratePatientForm,
      resetForm: resetPatientForm,
      submit: handlePatientSubmit,
      remove: handlePatientDelete,
    },
    lookups: {
      providerForm,
      payerForm,
      updateProviderField,
      updatePayerField,
      submitProvider: handleProviderSubmit,
      submitPayer: handlePayerSubmit,
    },
    claims: {
      form: claimForm,
      draftTotal: claimDraftTotal,
      updateField: updateClaimField,
      updateProcedureField,
      addProcedure,
      removeProcedure,
      updateDiagnosisField,
      addDiagnosis,
      removeDiagnosis,
      submitDraft: handleClaimDraftSubmit,
      submitClaim: handleClaimSubmitAction,
    },
    payments: {
      form: paymentForm,
      latestLink: latestPaymentLink,
      updateField: updatePaymentField,
      submit: handlePaymentSubmit,
      openLatestLink,
      copyLatestLink,
    },
    denials: {
      form: denialForm,
      updateField: updateDenialField,
      submit: handleDenialSubmit,
    },
    audit: {
      selectedId: selectedAuditLogId,
      selectedLog: selectedAuditLog,
      setSelectedId: setSelectedAuditLogId,
    },
  };
}
