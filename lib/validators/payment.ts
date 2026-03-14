import { z } from "zod";

import { moneySchema, uuidSchema } from "@/lib/validators/common";

export const paymentLinkSchema = z.object({
  patient_id: uuidSchema,
  claim_id: uuidSchema.nullable(),
  amount: moneySchema.refine((value) => value > 0, {
    message: "Amount must be greater than zero.",
  }),
  description: z.string().trim().min(1).max(255),
});
