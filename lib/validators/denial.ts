import { z } from "zod";

import { isoDateSchema, uuidSchema } from "@/lib/validators/common";

export const denialSchema = z.object({
  claim_id: uuidSchema,
  reason_code: z.string().trim().min(1).max(25),
  reason_desc: z.string().trim().min(1).max(255),
  appeal_deadline: isoDateSchema.nullable(),
});
