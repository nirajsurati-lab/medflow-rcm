import { z } from "zod";

import { isoDateSchema, moneySchema, uuidSchema } from "@/lib/validators/common";

export const feeScheduleSchema = z.object({
  payer_id: uuidSchema,
  cpt_code: z.string().trim().min(1).max(20),
  allowed_amount: moneySchema,
  effective_date: isoDateSchema,
});
