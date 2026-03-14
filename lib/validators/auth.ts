import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(8),
});

export const signupSchema = z
  .object({
    organization_name: z.string().trim().min(2).max(120),
    first_name: z.string().trim().min(1).max(60),
    last_name: z.string().trim().min(1).max(60),
    email: z.string().trim().email(),
    password: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters."),
    confirm_password: z.string().trim().min(8),
  })
  .refine((value) => value.password === value.confirm_password, {
    message: "Passwords must match.",
    path: ["confirm_password"],
  });
