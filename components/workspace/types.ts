import type { FormEvent } from "react";
import {
  Activity,
  BadgeDollarSign,
  History,
  LayoutDashboard,
  ReceiptText,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

export type WorkspaceTab =
  | "dashboard"
  | "patients"
  | "claims"
  | "payments"
  | "denials"
  | "audit";

export const ALL_WORKSPACE_TABS = [
  "dashboard",
  "patients",
  "claims",
  "payments",
  "denials",
  "audit",
] as const satisfies readonly WorkspaceTab[];

export const WORKSPACE_TAB_LABELS: Record<WorkspaceTab, string> = {
  dashboard: "Dashboard",
  patients: "Patients",
  claims: "Claims",
  payments: "Payments",
  denials: "Denials",
  audit: "Audit",
};

export const WORKSPACE_TAB_META: Record<
  WorkspaceTab,
  {
    label: string;
    description: string;
    icon: LucideIcon;
  }
> = {
  dashboard: {
    label: "Dashboard",
    description:
      "Track revenue health, A/R aging, and the highest-priority work across your billing operations.",
    icon: LayoutDashboard,
  },
  patients: {
    label: "Patients",
    description:
      "Maintain the patient roster, demographics, and insurance identifiers used throughout the workflow.",
    icon: Users,
  },
  claims: {
    label: "Claims",
    description:
      "Draft claims, enrich payer setup, and push billing work through the submission queue.",
    icon: ReceiptText,
  },
  payments: {
    label: "Payments",
    description:
      "Create internal demo checkout links and keep patient payment attempts visible to the team.",
    icon: BadgeDollarSign,
  },
  denials: {
    label: "Denials",
    description:
      "Capture payer feedback, track appeal timing, and keep denial follow-up organized.",
    icon: Activity,
  },
  audit: {
    label: "Audit",
    description:
      "Review admin-only activity history and inspect before-and-after payload changes.",
    icon: History,
  },
};

export type PatientRow = PhaseTwoWorkspaceData["patients"][number];
export type ClaimRow = PhaseTwoWorkspaceData["claims"][number];
export type PaymentRow = PhaseTwoWorkspaceData["payments"][number];
export type AuditLogRow = PhaseTwoWorkspaceData["audit_logs"][number];

export type PhaseTwoWorkspaceProps = {
  data: PhaseTwoWorkspaceData;
  initialTab: string;
  paymentStatus: string | null;
  organizationName: string;
  userRole: string;
  userEmail: string;
};

export type FeedbackState = {
  tone: "success" | "error";
  title: string;
  message: string;
} | null;

export type SelectOption = {
  id: string;
  label: string;
};

export type PatientFormState = {
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

export type ProviderFormState = {
  npi: string;
  first_name: string;
  last_name: string;
  specialty: string;
};

export type PayerFormState = {
  name: string;
  payer_id: string;
  contact_email: string;
  contact_phone: string;
};

export type ClaimProcedureState = {
  cpt_code: string;
  description: string;
  units: string;
  charge_amount: string;
  allowed_amount: string;
};

export type ClaimDiagnosisState = {
  icd10_code: string;
  description: string;
  sequence: string;
};

export type ClaimFormState = {
  patient_id: string;
  provider_id: string;
  payer_id: string;
  procedures: ClaimProcedureState[];
  diagnoses: ClaimDiagnosisState[];
};

export type PaymentFormState = {
  patient_id: string;
  claim_id: string;
  amount: string;
  description: string;
};

export type DenialFormState = {
  claim_id: string;
  reason_code: string;
  reason_desc: string;
  appeal_deadline: string;
};

export type QuickNavItem = {
  tab: Exclude<WorkspaceTab, "dashboard">;
  title: string;
  description: string;
  icon: LucideIcon;
};

export type WorkspaceController = {
  meta: {
    activeTab: WorkspaceTab;
    visibleTabs: readonly WorkspaceTab[];
    isRefreshing: boolean;
    pendingAction: string | null;
    feedback: FeedbackState;
  };
  actions: {
    setActiveTab: (tab: string) => void;
    refreshWorkspace: () => void;
    clearFeedback: () => void;
  };
  dashboard: {
    queuePreview: PhaseTwoWorkspaceData["dashboard"]["claims_queue"];
    quickNavItems: QuickNavItem[];
  };
  shared: {
    patientOptions: SelectOption[];
    claimOptions: SelectOption[];
  };
  patients: {
    editingPatientId: string | null;
    search: string;
    filtered: PatientRow[];
    form: PatientFormState;
    setSearch: (value: string) => void;
    updateField: (field: keyof PatientFormState, value: string) => void;
    hydrate: (patient: PatientRow) => void;
    resetForm: () => void;
    submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    remove: (patient: PatientRow) => Promise<void>;
  };
  lookups: {
    providerForm: ProviderFormState;
    payerForm: PayerFormState;
    updateProviderField: (field: keyof ProviderFormState, value: string) => void;
    updatePayerField: (field: keyof PayerFormState, value: string) => void;
    submitProvider: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    submitPayer: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  };
  claims: {
    form: ClaimFormState;
    draftTotal: number;
    updateField: (
      field: "patient_id" | "provider_id" | "payer_id",
      value: string
    ) => void;
    updateProcedureField: (
      index: number,
      field: keyof ClaimProcedureState,
      value: string
    ) => void;
    addProcedure: () => void;
    removeProcedure: (index: number) => void;
    updateDiagnosisField: (
      index: number,
      field: keyof ClaimDiagnosisState,
      value: string
    ) => void;
    addDiagnosis: () => void;
    removeDiagnosis: (index: number) => void;
    submitDraft: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    submitClaim: (claim: ClaimRow) => Promise<void>;
  };
  payments: {
    form: PaymentFormState;
    latestLink: string | null;
    updateField: (field: keyof PaymentFormState, value: string) => void;
    submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    openLatestLink: () => void;
    copyLatestLink: () => Promise<void>;
  };
  denials: {
    form: DenialFormState;
    updateField: (field: keyof DenialFormState, value: string) => void;
    submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  };
  audit: {
    selectedId: string | null;
    selectedLog: AuditLogRow | null;
    setSelectedId: (id: string) => void;
  };
};
