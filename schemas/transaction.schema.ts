import { z } from "zod";
import { TransactionType } from "@/types/prisma";
import { TRANSACTION_TAGS } from "@/types/transaction";

export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  accountId: z.string().uuid("Please select an account"),
  type: z.nativeEnum(TransactionType),
  amount: z.number().positive("Amount must be greater than 0"),
  note: z.string().max(500, "Note must be less than 500 characters").optional(),
  tags: z.array(z.enum(TRANSACTION_TAGS)).default([]),
  transactedAt: z.date(),
});

export const createTransactionSchema = transactionSchema.omit({ id: true });

export const updateTransactionSchema = transactionSchema.partial().required({ id: true });

export const transferSchema = z.object({
  fromAccountId: z.string().uuid("Please select source account"),
  toAccountId: z.string().uuid("Please select destination account"),
  amount: z.number().positive("Amount must be greater than 0"),
  note: z.string().max(500, "Note must be less than 500 characters").optional(),
  transactedAt: z.date(),
}).refine((data) => data.fromAccountId !== data.toAccountId, {
  message: "Source and destination accounts must be different",
  path: ["toAccountId"],
});

export const reverseTransactionSchema = z.object({
  id: z.string().uuid(),
  note: z.string().max(500, "Note must be less than 500 characters").optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
export type CreateTransactionFormData = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionFormData = z.infer<typeof updateTransactionSchema>;
export type TransferFormData = z.infer<typeof transferSchema>;
