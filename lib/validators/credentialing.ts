import { z } from "zod";

import { isoDateSchema, uuidSchema } from "@/lib/validators/common";

export const credentialingSchema = z.object({
  provider_id: uuidSchema,
  payer_id: uuidSchema,
  status: z.enum(["pending", "submitted", "approved", "expired", "denied"]),
  submitted_at: z.string().datetime().nullable(),
  approved_at: z.string().datetime().nullable(),
  expiry_date: isoDateSchema.nullable(),
  notes: z.string().trim().max(4000).nullable(),
});
