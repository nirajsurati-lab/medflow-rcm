import { z } from "zod";

export const providerSchema = z.object({
  npi: z.string().trim().min(6).max(20),
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().min(1),
  specialty: z.string().trim().max(120).nullable(),
});
