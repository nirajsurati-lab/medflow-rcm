import { z } from "zod";

export const payerSchema = z.object({
  name: z.string().trim().min(1),
  payer_id: z.string().trim().min(2).max(50),
  contact_email: z.string().trim().email().nullable(),
  contact_phone: z.string().trim().max(25).nullable(),
});
