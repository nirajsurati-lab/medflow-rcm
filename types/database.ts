export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type Timestamp = string;
type UUID = string;

export type Database = {
  public: {
    Tables: {
      organizations: Table<
        {
          id: UUID;
          name: string;
          npi: string | null;
          tax_id: string | null;
          address: Json | null;
          plan_tier: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          name: string;
          npi?: string | null;
          tax_id?: string | null;
          address?: Json | null;
          plan_tier?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          name?: string;
          npi?: string | null;
          tax_id?: string | null;
          address?: Json | null;
          plan_tier?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      users: Table<
        {
          id: UUID;
          org_id: UUID;
          email: string;
          role: string;
          first_name: string | null;
          last_name: string | null;
          last_login: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id: UUID;
          org_id: UUID;
          email: string;
          role?: string;
          first_name?: string | null;
          last_name?: string | null;
          last_login?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          email?: string;
          role?: string;
          first_name?: string | null;
          last_name?: string | null;
          last_login?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      patients: Table<
        {
          id: UUID;
          org_id: UUID;
          location_id: UUID | null;
          first_name: string;
          last_name: string;
          dob: string;
          insurance_id: string | null;
          address: Json | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          location_id?: UUID | null;
          first_name: string;
          last_name: string;
          dob: string;
          insurance_id?: string | null;
          address?: Json | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          location_id?: UUID | null;
          first_name?: string;
          last_name?: string;
          dob?: string;
          insurance_id?: string | null;
          address?: Json | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      providers: Table<
        {
          id: UUID;
          org_id: UUID;
          location_id: UUID | null;
          npi: string;
          first_name: string;
          last_name: string;
          specialty: string | null;
          credentials_status: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          location_id?: UUID | null;
          npi: string;
          first_name: string;
          last_name: string;
          specialty?: string | null;
          credentials_status?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          location_id?: UUID | null;
          npi?: string;
          first_name?: string;
          last_name?: string;
          specialty?: string | null;
          credentials_status?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      locations: Table<
        {
          id: UUID;
          org_id: UUID;
          name: string;
          is_default: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          name: string;
          is_default?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          name?: string;
          is_default?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      payers: Table<
        {
          id: UUID;
          org_id: UUID;
          name: string;
          payer_id: string;
          clearinghouse: string | null;
          api_endpoint: string | null;
          contact_info: Json | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          name: string;
          payer_id: string;
          clearinghouse?: string | null;
          api_endpoint?: string | null;
          contact_info?: Json | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          name?: string;
          payer_id?: string;
          clearinghouse?: string | null;
          api_endpoint?: string | null;
          contact_info?: Json | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      fee_schedules: Table<
        {
          id: UUID;
          org_id: UUID;
          payer_id: UUID;
          cpt_code: string;
          allowed_amount: number;
          effective_date: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          payer_id: UUID;
          cpt_code: string;
          allowed_amount: number;
          effective_date: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          payer_id?: UUID;
          cpt_code?: string;
          allowed_amount?: number;
          effective_date?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      insurance_plans: Table<
        {
          id: UUID;
          org_id: UUID;
          payer_name: string;
          payer_id: UUID;
          plan_type: string;
          contact_info: Json | null;
          fee_schedule_id: UUID | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          payer_name: string;
          payer_id: UUID;
          plan_type: string;
          contact_info?: Json | null;
          fee_schedule_id?: UUID | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          payer_name?: string;
          payer_id?: UUID;
          plan_type?: string;
          contact_info?: Json | null;
          fee_schedule_id?: UUID | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      authorizations: Table<
        {
          id: UUID;
          org_id: UUID;
          location_id: UUID | null;
          patient_id: UUID;
          payer_id: UUID;
          procedure_codes: string[];
          status: string;
          valid_from: string | null;
          valid_to: string | null;
          notes: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          location_id?: UUID | null;
          patient_id: UUID;
          payer_id: UUID;
          procedure_codes?: string[];
          status?: string;
          valid_from?: string | null;
          valid_to?: string | null;
          notes?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          location_id?: UUID | null;
          patient_id?: UUID;
          payer_id?: UUID;
          procedure_codes?: string[];
          status?: string;
          valid_from?: string | null;
          valid_to?: string | null;
          notes?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      appointments: Table<
        {
          id: UUID;
          org_id: UUID;
          location_id: UUID | null;
          patient_id: UUID;
          provider_id: UUID;
          payer_id: UUID | null;
          claim_id: UUID | null;
          scheduled_at: Timestamp;
          type: string;
          status: string;
          billing_status: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          location_id?: UUID | null;
          patient_id: UUID;
          provider_id: UUID;
          payer_id?: UUID | null;
          claim_id?: UUID | null;
          scheduled_at: Timestamp;
          type?: string;
          status?: string;
          billing_status?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          location_id?: UUID | null;
          patient_id?: UUID;
          provider_id?: UUID;
          payer_id?: UUID | null;
          claim_id?: UUID | null;
          scheduled_at?: Timestamp;
          type?: string;
          status?: string;
          billing_status?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      claims: Table<
        {
          id: UUID;
          org_id: UUID;
          location_id: UUID | null;
          patient_id: UUID;
          provider_id: UUID;
          payer_id: UUID;
          appointment_id: UUID | null;
          status: string;
          collections_status: string;
          collections_sent_at: Timestamp | null;
          dunning_notes: string | null;
          total_amount: number;
          submitted_at: Timestamp | null;
          paid_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          location_id?: UUID | null;
          patient_id: UUID;
          provider_id: UUID;
          payer_id: UUID;
          appointment_id?: UUID | null;
          status?: string;
          collections_status?: string;
          collections_sent_at?: Timestamp | null;
          dunning_notes?: string | null;
          total_amount?: number;
          submitted_at?: Timestamp | null;
          paid_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          location_id?: UUID | null;
          patient_id?: UUID;
          provider_id?: UUID;
          payer_id?: UUID;
          appointment_id?: UUID | null;
          status?: string;
          collections_status?: string;
          collections_sent_at?: Timestamp | null;
          dunning_notes?: string | null;
          total_amount?: number;
          submitted_at?: Timestamp | null;
          paid_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      procedures: Table<
        {
          id: UUID;
          org_id: UUID;
          claim_id: UUID;
          cpt_code: string;
          description: string | null;
          units: number;
          charge_amount: number;
          allowed_amount: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          claim_id: UUID;
          cpt_code: string;
          description?: string | null;
          units?: number;
          charge_amount?: number;
          allowed_amount?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          claim_id?: UUID;
          cpt_code?: string;
          description?: string | null;
          units?: number;
          charge_amount?: number;
          allowed_amount?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      diagnoses: Table<
        {
          id: UUID;
          org_id: UUID;
          claim_id: UUID;
          icd10_code: string;
          description: string | null;
          sequence: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          claim_id: UUID;
          icd10_code: string;
          description?: string | null;
          sequence?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          claim_id?: UUID;
          icd10_code?: string;
          description?: string | null;
          sequence?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      payments: Table<
        {
          id: UUID;
          org_id: UUID;
          location_id: UUID | null;
          claim_id: UUID | null;
          patient_id: UUID;
          amount: number;
          method: string;
          stripe_id: string | null;
          received_at: Timestamp | null;
          status: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          location_id?: UUID | null;
          claim_id?: UUID | null;
          patient_id: UUID;
          amount: number;
          method?: string;
          stripe_id?: string | null;
          received_at?: Timestamp | null;
          status?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          location_id?: UUID | null;
          claim_id?: UUID | null;
          patient_id?: UUID;
          amount?: number;
          method?: string;
          stripe_id?: string | null;
          received_at?: Timestamp | null;
          status?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      adjustments: Table<
        {
          id: UUID;
          org_id: UUID;
          claim_id: UUID;
          type: string;
          amount: number;
          reason_code: string | null;
          applied_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          claim_id: UUID;
          type: string;
          amount: number;
          reason_code?: string | null;
          applied_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          claim_id?: UUID;
          type?: string;
          amount?: number;
          reason_code?: string | null;
          applied_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      denials: Table<
        {
          id: UUID;
          org_id: UUID;
          claim_id: UUID;
          reason_code: string;
          reason_desc: string;
          appeal_deadline: string | null;
          status: string;
          resubmitted_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          claim_id: UUID;
          reason_code: string;
          reason_desc: string;
          appeal_deadline?: string | null;
          status?: string;
          resubmitted_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          claim_id?: UUID;
          reason_code?: string;
          reason_desc?: string;
          appeal_deadline?: string | null;
          status?: string;
          resubmitted_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      appeals: Table<
        {
          id: UUID;
          org_id: UUID;
          denial_id: UUID;
          submitted_at: Timestamp | null;
          status: string;
          resolution: string | null;
          notes: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          denial_id: UUID;
          submitted_at?: Timestamp | null;
          status?: string;
          resolution?: string | null;
          notes?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          denial_id?: UUID;
          submitted_at?: Timestamp | null;
          status?: string;
          resolution?: string | null;
          notes?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      statements: Table<
        {
          id: UUID;
          org_id: UUID;
          location_id: UUID | null;
          patient_id: UUID;
          claim_id: UUID | null;
          amount_due: number;
          due_date: string;
          sent_at: Timestamp | null;
          last_sent_at: Timestamp | null;
          paid_at: Timestamp | null;
          status: string;
          delivery_method: string;
          public_token: string | null;
          token_expires_at: Timestamp | null;
          stripe_checkout_url: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          location_id?: UUID | null;
          patient_id: UUID;
          claim_id?: UUID | null;
          amount_due: number;
          due_date: string;
          sent_at?: Timestamp | null;
          last_sent_at?: Timestamp | null;
          paid_at?: Timestamp | null;
          status?: string;
          delivery_method?: string;
          public_token?: string | null;
          token_expires_at?: Timestamp | null;
          stripe_checkout_url?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          location_id?: UUID | null;
          patient_id?: UUID;
          claim_id?: UUID | null;
          amount_due?: number;
          due_date?: string;
          sent_at?: Timestamp | null;
          last_sent_at?: Timestamp | null;
          paid_at?: Timestamp | null;
          status?: string;
          delivery_method?: string;
          public_token?: string | null;
          token_expires_at?: Timestamp | null;
          stripe_checkout_url?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      statement_line_items: Table<
        {
          id: UUID;
          org_id: UUID;
          statement_id: UUID;
          claim_id: UUID | null;
          kind: string;
          label: string;
          amount: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          statement_id: UUID;
          claim_id?: UUID | null;
          kind: string;
          label: string;
          amount: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          statement_id?: UUID;
          claim_id?: UUID | null;
          kind?: string;
          label?: string;
          amount?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      credentialing: Table<
        {
          id: UUID;
          org_id: UUID;
          location_id: UUID | null;
          provider_id: UUID;
          payer_id: UUID;
          status: string;
          submitted_at: Timestamp | null;
          approved_at: Timestamp | null;
          expiry_date: string | null;
          notes: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          location_id?: UUID | null;
          provider_id: UUID;
          payer_id: UUID;
          status?: string;
          submitted_at?: Timestamp | null;
          approved_at?: Timestamp | null;
          expiry_date?: string | null;
          notes?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          location_id?: UUID | null;
          provider_id?: UUID;
          payer_id?: UUID;
          status?: string;
          submitted_at?: Timestamp | null;
          approved_at?: Timestamp | null;
          expiry_date?: string | null;
          notes?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      audit_logs: Table<
        {
          id: UUID;
          org_id: UUID;
          user_id: UUID | null;
          action: string;
          table_name: string;
          record_id: UUID;
          old_data: Json | null;
          new_data: Json | null;
          created_at: Timestamp;
        },
        {
          id?: UUID;
          org_id: UUID;
          user_id?: UUID | null;
          action: string;
          table_name: string;
          record_id: UUID;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: Timestamp;
        },
        {
          id?: UUID;
          org_id?: UUID;
          user_id?: UUID | null;
          action?: string;
          table_name?: string;
          record_id?: UUID;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: Timestamp;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
