import { z } from "zod";

import { uuidSchema } from "@/lib/validators/common";

export const appointmentSchema = z.object({
  patient_id: uuidSchema,
  provider_id: uuidSchema,
  payer_id: uuidSchema.nullable(),
  scheduled_at: z.string().datetime(),
  type: z.string().trim().min(1).max(100),
  status: z.enum(["scheduled", "checked_in", "completed", "cancelled", "no_show"]),
  billing_status: z.enum(["pending", "ready", "claimed", "paid"]),
});
