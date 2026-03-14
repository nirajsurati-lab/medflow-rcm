import { z } from "zod";

export const collectionUpdateSchema = z.object({
  collections_status: z.enum(["overdue", "sent"]).optional(),
  dunning_notes: z.string().trim().max(4000).nullable().optional(),
});
