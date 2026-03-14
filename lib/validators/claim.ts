import { z } from "zod";

import { moneySchema, uuidSchema } from "@/lib/validators/common";

const procedureSchema = z.object({
  cpt_code: z.string().trim().min(1).max(20),
  description: z.string().trim().max(255).nullable(),
  units: z.coerce.number().int().min(1),
  charge_amount: moneySchema,
  allowed_amount: moneySchema,
});

const diagnosisSchema = z.object({
  icd10_code: z.string().trim().min(1).max(20),
  description: z.string().trim().max(255).nullable(),
  sequence: z.coerce.number().int().min(1),
});

export const claimSchema = z.object({
  patient_id: uuidSchema,
  provider_id: uuidSchema,
  payer_id: uuidSchema,
  procedures: z.array(procedureSchema).min(1),
  diagnoses: z.array(diagnosisSchema).min(1),
});

export const claimSubmitSchema = z.object({
  id: uuidSchema,
});
