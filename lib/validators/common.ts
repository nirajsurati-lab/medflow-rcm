import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const isoDateSchema = z.string().date();

export const moneySchema = z
  .coerce.number()
  .finite()
  .min(0)
  .transform((value) => Number(value.toFixed(2)));
