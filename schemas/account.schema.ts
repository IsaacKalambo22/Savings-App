import { z } from "zod";
import { AccountStatus } from "@/types/prisma";
import { ACCOUNT_ICONS } from "@/types/account";

export const accountSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Account name is required").max(50, "Name must be less than 50 characters"),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
  icon: z.enum(ACCOUNT_ICONS),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code"),
  status: z.nativeEnum(AccountStatus),
  sortOrder: z.number().int().optional(),
});

export const createAccountSchema = accountSchema.omit({ id: true, sortOrder: true });

export const updateAccountSchema = accountSchema.partial().required({ id: true });

export const archiveAccountSchema = z.object({
  id: z.string().uuid(),
  status: z.literal(AccountStatus.ARCHIVED),
});

export type AccountFormData = z.infer<typeof accountSchema>;
export type CreateAccountFormData = z.infer<typeof createAccountSchema>;
export type UpdateAccountFormData = z.infer<typeof updateAccountSchema>;
