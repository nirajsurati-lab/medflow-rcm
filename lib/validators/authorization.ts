import { z } from "zod";

import { isoDateSchema, uuidSchema } from "@/lib/validators/common";

export const authorizationSchema = z.object({
  patient_id: uuidSchema,
  payer_id: uuidSchema,
  procedure_codes: z.array(z.string().trim().min(1)).min(1),
  status: z.enum(["pending", "approved", "denied", "expired"]),
  valid_from: isoDateSchema.nullable(),
  valid_to: isoDateSchema.nullable(),
  notes: z.string().trim().max(2000).nullable(),
});
