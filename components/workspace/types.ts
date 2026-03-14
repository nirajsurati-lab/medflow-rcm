import type { FormEvent } from "react";
import {
  Activity,
  BadgeDollarSign,
  CalendarDays,
  ClipboardList,
  FileBadge2,
  History,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { PhaseTwoWorkspaceData } from "@/lib/services/workspace";

export type WorkspaceTab =
  | "dashboard"
  | "patients"
  | "claims"
  | "authorizations"
  | "statements"
  | "collections"
  | "appointments"
  | "payments"
  | "denials"
  | "audit";

export const ALL_WORKSPACE_TABS = [
  "dashboard",
  "patients",
  "claims",
  "authorizations",
  "statements",
  "collections",
  "appointments",
  "payments",
  "denials",
  "audit",
] as const satisfies readonly WorkspaceTab[];

export const WORKSPACE_TAB_LABELS: Record<WorkspaceTab, string> = {
  dashboard: "Dashboard",
  patients: "Patients",
  claims: "Claims",
  authorizations: "Authorizations",
  statements: "Statements",
  collections: "Collections",
  appointments: "Appointments",
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
  authorizations: {
    label: "Authorizations",
    description:
      "Track prior authorization coverage by patient, payer, and CPT code before claims are submitted.",
    icon: ShieldCheck,
  },
  statements: {
    label: "Statements",
    description:
      "Review patient statements, send billing notices, and expose secure public pay links.",
    icon: FileBadge2,
  },
  collections: {
    label: "Collections",
    description:
      "Monitor overdue claims, log dunning outreach, and mark accounts sent to collections.",
    icon: ClipboardList,
  },
  appointments: {
    label: "Appointments",
    description:
      "Drive billing work from scheduled visits and convert completed visits into claim-ready work.",
    icon: CalendarDays,
  },
  payments: {
    label: "Payments",
    description:
      "Create internal payment links and compare billed, allowed, and paid amounts.",
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
export type AuthorizationRow = PhaseTwoWorkspaceData["authorizations"][number];
export type StatementRow = PhaseTwoWorkspaceData["statements"][number];
export type CollectionRow = PhaseTwoWorkspaceData["collections"][number];
export type AppointmentRow = PhaseTwoWorkspaceData["appointments"][number];
export type LocationRow = PhaseTwoWorkspaceData["locations"][number];
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

export type LocationOption = SelectOption & {
  is_default?: boolean;
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

export type AuthorizationFormState = {
  patient_id: string;
  payer_id: string;
  procedure_codes: string;
  status: string;
  valid_from: string;
  valid_to: string;
  notes: string;
};

export type AppointmentFormState = {
  patient_id: string;
  provider_id: string;
  payer_id: string;
  scheduled_at: string;
  type: string;
  status: string;
  billing_status: string;
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
    activeLocationId: string | null;
  };
  actions: {
    setActiveTab: (tab: string) => void;
    refreshWorkspace: () => void;
    clearFeedback: () => void;
    setLocation: (locationId: string) => void;
  };
  dashboard: {
    queuePreview: PhaseTwoWorkspaceData["dashboard"]["claims_queue"];
    quickNavItems: QuickNavItem[];
  };
  shared: {
    patientOptions: SelectOption[];
    claimOptions: SelectOption[];
    payerOptions: SelectOption[];
    providerOptions: SelectOption[];
    locationOptions: LocationOption[];
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
    getAuthorizationStatus: (patientId: string) => {
      label: string;
      tone: "default" | "destructive" | "secondary" | "outline";
    };
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
    editingClaimId: string | null;
    form: ClaimFormState;
    draftTotal: number;
    authReview: {
      status: "approved" | "missing" | "expired" | "denied";
      message: string;
    } | null;
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
    loadDraft: (claim: ClaimRow) => void;
    resetDraft: () => void;
    submitDraft: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    submitClaim: (claim: ClaimRow) => Promise<void>;
  };
  authorizations: {
    form: AuthorizationFormState;
    updateField: (field: keyof AuthorizationFormState, value: string) => void;
    submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  };
  statements: {
    selectedId: string | null;
    selectedStatement: StatementRow | null;
    setSelectedId: (id: string) => void;
    sendStatement: (statement: StatementRow) => Promise<void>;
  };
  collections: {
    updateNotes: (claim: CollectionRow, value: string) => Promise<void>;
    markSent: (claim: CollectionRow) => Promise<void>;
  };
  appointments: {
    form: AppointmentFormState;
    updateField: (field: keyof AppointmentFormState, value: string) => void;
    submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    complete: (appointment: AppointmentRow) => Promise<void>;
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
