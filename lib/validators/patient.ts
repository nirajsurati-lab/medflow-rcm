import { z } from "zod";

import { isoDateSchema, uuidSchema } from "@/lib/validators/common";

const addressSchema = z
  .object({
    line1: z.string().trim().min(1),
    line2: z.string().trim().optional(),
    city: z.string().trim().min(1),
    state: z.string().trim().min(2).max(2),
    zip: z.string().trim().min(5).max(10),
  })
  .nullable();

export const patientSchema = z.object({
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().min(1),
  dob: isoDateSchema,
  insurance_id: z.string().trim().max(120).nullable(),
  address: addressSchema,
});

export const patientUpdateSchema = patientSchema.extend({
  id: uuidSchema,
});
