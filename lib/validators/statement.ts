import { z } from "zod";

import { uuidSchema } from "@/lib/validators/common";

export const statementSendSchema = z.object({
  id: uuidSchema,
});

export const statementTokenSchema = z.object({
  token: z.string().trim().min(16),
});
