"use client";

import type { FormEvent } from "react";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  AppointmentFormState,
  AppointmentRow,
  AuthorizationFormState,
  ClaimDiagnosisState,
  ClaimProcedureState,
  ClaimRow,
  CollectionRow,
  PatientRow,
  PhaseTwoWorkspaceProps,
  ProviderFormState,
  WorkspaceController,
  WorkspaceTab,
  PayerFormState,
  PatientFormState,
  PaymentFormState,
  DenialFormState,
  StatementRow,
} from "@/components/workspace/types";
import {
  ALL_WORKSPACE_TABS,
  WORKSPACE_TAB_META,
} from "@/components/workspace/types";
import {
  buildPatientPayload,
  emptyAppointmentForm,
  emptyAuthorizationForm,
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
      title: "Payment completed",
      message:
        "The payment posted successfully and any remaining patient balance was re-evaluated for statement generation.",
    };
  }

  if (paymentStatus === "cancelled") {
    return {
      tone: "error" as const,
      title: "Payment cancelled",
      message:
        "The payment attempt was cancelled. You can generate a fresh link from the Payments tab.",
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isRefreshing, startTransition] = useTransition();
  const visibleTabs: readonly WorkspaceTab[] =
    userRole === "admin"
      ? ALL_WORKSPACE_TABS
      : ALL_WORKSPACE_TABS.filter((tab) => tab !== "audit");
  const safeInitialTab = visibleTabs.includes(initialTab as WorkspaceTab)
    ? (initialTab as WorkspaceTab)
    : "dashboard";

  const initialLocationId =
    searchParams.get("location") ??
    data.locations[0]?.id ??
    null;

  const [activeTab, setActiveTabState] = useState<WorkspaceTab>(safeInitialTab);
  const [feedback, setFeedback] = useState(getInitialFeedback(paymentStatus));
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientForm, setPatientForm] = useState(emptyPatientForm);
  const [providerForm, setProviderForm] = useState(emptyProviderForm);
  const [payerForm, setPayerForm] = useState(emptyPayerForm);
  const [claimForm, setClaimForm] = useState(emptyClaimForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [authorizationForm, setAuthorizationForm] = useState(emptyAuthorizationForm);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointmentForm);
  const [denialForm, setDenialForm] = useState(emptyDenialForm);
  const [latestPaymentLink, setLatestPaymentLink] = useState<string | null>(null);
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(
    data.statements[0]?.id ?? null
  );
  const [selectedAuditLogId, setSelectedAuditLogId] = useState<string | null>(
    data.audit_logs[0]?.id ?? null
  );
  const [activeLocationId, setActiveLocationId] = useState<string | null>(initialLocationId);
  const deferredPatientSearch = useDeferredValue(patientSearch);

  useEffect(() => {
    setActiveTabState(safeInitialTab);
  }, [safeInitialTab]);

  useEffect(() => {
    setFeedback(getInitialFeedback(paymentStatus));
  }, [paymentStatus]);

  useEffect(() => {
    setActiveLocationId(initialLocationId);
  }, [initialLocationId]);

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

  const patientOptions = useMemo(
    () =>
      data.patients.map((patient) => ({
        id: patient.id,
        label: `${patient.first_name} ${patient.last_name}`.trim(),
      })),
    [data.patients]
  );

  const claimOptions = useMemo(
    () =>
      data.claims.map((claim) => ({
        id: claim.id,
        label: `${claim.patient_name} · ${formatCurrency(claim.total_amount)} · ${formatStatusLabel(
          claim.status
        )}`,
      })),
    [data.claims]
  );

  const payerOptions = useMemo(
    () =>
      data.payers.map((payer) => ({
        id: payer.id,
        label: payer.name,
      })),
    [data.payers]
  );

  const providerOptions = useMemo(
    () =>
      data.providers.map((provider) => ({
        id: provider.id,
        label: `${provider.first_name} ${provider.last_name}`.trim(),
      })),
    [data.providers]
  );

  const locationOptions = useMemo(
    () =>
      data.locations.map((location) => ({
        id: location.id,
        label: location.name,
        is_default: location.is_default,
      })),
    [data.locations]
  );

  const queuePreview = data.dashboard.claims_queue.slice(0, 3);
  const selectedStatement =
    data.statements.find((statement) => statement.id === selectedStatementId) ??
    data.statements[0] ??
    null;
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

  const claimAuthReview = useMemo(() => {
    const codes = claimForm.procedures
      .map((procedure) => procedure.cpt_code.trim().toUpperCase())
      .filter(Boolean);

    if (!claimForm.patient_id || !claimForm.payer_id || codes.length === 0) {
      return null;
    }

    const today = new Date().toISOString().slice(0, 10);
    const matches = data.authorizations.filter(
      (authorization) =>
        authorization.patient_id === claimForm.patient_id &&
        authorization.payer_id === claimForm.payer_id &&
        codes.every((code) => authorization.procedure_codes.includes(code))
    );

    if (matches.length === 0) {
      return {
        status: "missing" as const,
        message:
          "No prior authorization covers all CPT codes on this claim. Create an authorization before submission.",
      };
    }

    const latest = matches[0];

    if (latest.status === "denied") {
      return {
        status: "denied" as const,
        message: "The matching prior authorization is denied and this claim cannot be submitted.",
      };
    }

    if (
      latest.status !== "approved" ||
      (latest.valid_from && latest.valid_from > today) ||
      (latest.valid_to && latest.valid_to < today)
    ) {
      return {
        status: "expired" as const,
        message:
          "The matching prior authorization is not active for the current date range.",
      };
    }

    return {
      status: "approved" as const,
      message: "An active approved prior authorization is on file for this claim.",
    };
  }, [claimForm, data.authorizations]);

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

  function setLocation(locationId: string) {
    setActiveLocationId(locationId);

    const params = new URLSearchParams(searchParams.toString());
    params.set("location", locationId);
    params.set("tab", activeTab);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function updatePatientField(field: keyof PatientFormState, value: string) {
    setPatientForm((current) => ({
      ...current,
      [field]: field === "state" ? value.toUpperCase() : value,
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

  function getPatientAuthorizationStatus(patientId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const records = data.authorizations.filter((item) => item.patient_id === patientId);

    if (records.some((item) => item.status === "approved" && (!item.valid_from || item.valid_from <= today) && (!item.valid_to || item.valid_to >= today))) {
      return { label: "Authorized", tone: "default" as const };
    }

    if (records.some((item) => item.status === "denied")) {
      return { label: "Denied", tone: "destructive" as const };
    }

    if (records.length > 0) {
      return { label: "Expired", tone: "secondary" as const };
    }

    return { label: "No auth", tone: "outline" as const };
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
          : "The new patient is now available for claims, statements, and authorizations.",
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
        message: "The payer is now available when drafting claims and authorizations.",
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
      diagnoses: [...current.diagnoses, emptyDiagnosis(current.diagnoses.length + 1)],
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

  function loadClaimDraft(claim: ClaimRow) {
    setEditingClaimId(claim.id);
    setClaimForm({
      patient_id: claim.patient_id,
      provider_id: claim.provider_id,
      payer_id: claim.payer_id,
      procedures:
        claim.procedures.length > 0
          ? claim.procedures.map((procedure) => ({
              cpt_code: procedure.cpt_code,
              description: procedure.description ?? "",
              units: String(procedure.units),
              charge_amount: String(procedure.charge_amount),
              allowed_amount: String(procedure.allowed_amount),
            }))
          : [emptyProcedure()],
      diagnoses:
        claim.diagnoses.length > 0
          ? claim.diagnoses.map((diagnosis) => ({
              icd10_code: diagnosis.icd10_code,
              description: diagnosis.description ?? "",
              sequence: String(diagnosis.sequence),
            }))
          : [emptyDiagnosis(1)],
    });
    setActiveTabState("claims");
  }

  function resetClaimDraft() {
    setEditingClaimId(null);
    setClaimForm(emptyClaimForm());
  }

  async function handleClaimDraftSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setPendingAction("create-claim");

    try {
      await requestJson(editingClaimId ? `/api/claims/${editingClaimId}` : "/api/claims", {
        method: editingClaimId ? "PATCH" : "POST",
        body: JSON.stringify({
          patient_id: claimForm.patient_id,
          provider_id: claimForm.provider_id,
          payer_id: claimForm.payer_id,
          procedures: claimForm.procedures.map((procedure) => ({
            cpt_code: procedure.cpt_code.trim().toUpperCase(),
            description: procedure.description.trim() || null,
            units: Number(procedure.units),
            charge_amount: Number(procedure.charge_amount),
            allowed_amount: Number(procedure.allowed_amount),
          })),
          diagnoses: claimForm.diagnoses.map((diagnosis) => ({
            icd10_code: diagnosis.icd10_code.trim().toUpperCase(),
            description: diagnosis.description.trim() || null,
            sequence: Number(diagnosis.sequence),
          })),
        }),
      });

      resetClaimDraft();
      setFeedback({
        tone: "success",
        title: editingClaimId ? "Claim updated" : "Claim drafted",
        message: editingClaimId
          ? "The draft claim was updated successfully."
          : "The claim is saved as a draft and ready for submission.",
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

  function updateAuthorizationField(field: keyof AuthorizationFormState, value: string) {
    setAuthorizationForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleAuthorizationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setPendingAction("create-authorization");

    try {
      await requestJson("/api/authorizations", {
        method: "POST",
        body: JSON.stringify({
          patient_id: authorizationForm.patient_id,
          payer_id: authorizationForm.payer_id,
          procedure_codes: authorizationForm.procedure_codes
            .split(",")
            .map((code) => code.trim().toUpperCase())
            .filter(Boolean),
          status: authorizationForm.status,
          valid_from: authorizationForm.valid_from || null,
          valid_to: authorizationForm.valid_to || null,
          notes: authorizationForm.notes.trim() || null,
        }),
      });

      setAuthorizationForm(emptyAuthorizationForm());
      setFeedback({
        tone: "success",
        title: "Authorization created",
        message: "The prior authorization is now available for claim review.",
      });
      refreshWorkspace();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Authorization save failed",
        message:
          error instanceof Error ? error.message : "Unable to create the authorization.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  function updateAppointmentField(field: keyof AppointmentFormState, value: string) {
    setAppointmentForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleAppointmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setPendingAction("create-appointment");

    try {
      await requestJson("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          patient_id: appointmentForm.patient_id,
          provider_id: appointmentForm.provider_id,
          payer_id: appointmentForm.payer_id || null,
          scheduled_at: new Date(appointmentForm.scheduled_at).toISOString(),
          type: appointmentForm.type.trim(),
          status: appointmentForm.status,
          billing_status: appointmentForm.billing_status,
        }),
      });

      setAppointmentForm(emptyAppointmentForm());
      setFeedback({
        tone: "success",
        title: "Appointment created",
        message: "The appointment is now tracked in the billing pipeline.",
      });
      refreshWorkspace();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Appointment save failed",
        message:
          error instanceof Error ? error.message : "Unable to create the appointment.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleAppointmentComplete(appointment: AppointmentRow) {
    clearFeedback();
    setPendingAction(`complete-appointment-${appointment.id}`);

    try {
      await requestJson(`/api/appointments/${appointment.id}/complete`, {
        method: "PATCH",
      });

      setFeedback({
        tone: "success",
        title: "Appointment completed",
        message:
          "The appointment moved into billing and a draft claim shell was created for the visit.",
      });
      setActiveTabState("claims");
      refreshWorkspace();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Unable to complete appointment",
        message:
          error instanceof Error ? error.message : "Unable to convert the appointment into billing work.",
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
        title: "Payment link created",
        message: "The payment link is ready to open or share.",
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
        message: "The payment URL is on your clipboard.",
      });
    } catch {
      setFeedback({
        tone: "error",
        title: "Copy failed",
        message: "Clipboard access was blocked. Open the payment link directly instead.",
      });
    }
  }

  async function handleSendStatement(statement: StatementRow) {
    clearFeedback();
    setPendingAction(`send-statement-${statement.id}`);

    try {
      await requestJson(`/api/statements/${statement.id}/send`, {
        method: "PATCH",
      });

      setFeedback({
        tone: "success",
        title: "Statement sent",
        message: "The statement was marked as sent and the portal link remains available.",
      });
      refreshWorkspace();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Statement send failed",
        message:
          error instanceof Error ? error.message : "Unable to mark the statement as sent.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCollectionNoteUpdate(claim: CollectionRow, value: string) {
    clearFeedback();
    setPendingAction(`collection-note-${claim.id}`);

    try {
      await requestJson(`/api/collections/${claim.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          dunning_notes: value,
        }),
      });
      refreshWorkspace();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Collection note failed",
        message:
          error instanceof Error ? error.message : "Unable to save dunning notes.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCollectionMarkSent(claim: CollectionRow) {
    clearFeedback();
    setPendingAction(`collection-send-${claim.id}`);

    try {
      await requestJson(`/api/collections/${claim.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          collections_status: "sent",
        }),
      });

      setFeedback({
        tone: "success",
        title: "Claim sent to collections",
        message: `The collections workflow was updated for ${claim.patient_name}.`,
      });
      refreshWorkspace();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Collections update failed",
        message:
          error instanceof Error ? error.message : "Unable to update collections status.",
      });
    } finally {
      setPendingAction(null);
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
      activeLocationId,
    },
    actions: {
      setActiveTab,
      refreshWorkspace,
      clearFeedback,
      setLocation,
    },
    dashboard: {
      queuePreview,
      quickNavItems,
    },
    shared: {
      patientOptions,
      claimOptions,
      payerOptions,
      providerOptions,
      locationOptions,
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
      getAuthorizationStatus: getPatientAuthorizationStatus,
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
      editingClaimId,
      form: claimForm,
      draftTotal: claimDraftTotal,
      authReview: claimAuthReview,
      updateField: updateClaimField,
      updateProcedureField,
      addProcedure,
      removeProcedure,
      updateDiagnosisField,
      addDiagnosis,
      removeDiagnosis,
      loadDraft: loadClaimDraft,
      resetDraft: resetClaimDraft,
      submitDraft: handleClaimDraftSubmit,
      submitClaim: handleClaimSubmitAction,
    },
    authorizations: {
      form: authorizationForm,
      updateField: updateAuthorizationField,
      submit: handleAuthorizationSubmit,
    },
    statements: {
      selectedId: selectedStatementId,
      selectedStatement,
      setSelectedId: setSelectedStatementId,
      sendStatement: handleSendStatement,
    },
    collections: {
      updateNotes: handleCollectionNoteUpdate,
      markSent: handleCollectionMarkSent,
    },
    appointments: {
      form: appointmentForm,
      updateField: updateAppointmentField,
      submit: handleAppointmentSubmit,
      complete: handleAppointmentComplete,
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
