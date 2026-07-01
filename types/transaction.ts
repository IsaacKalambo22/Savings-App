import { Transaction, TransactionType } from "./prisma";
import { Account } from "./account";

export type TransactionWithAccount = Transaction & {
  account: Account;
};

export type TransactionFormData = {
  accountId: string;
  type: TransactionType;
  amount: number; // UI uses decimal, stored as BigInt
  note?: string;
  tags?: string[];
  transactedAt: Date;
};

export type TransferFormData = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
  transactedAt: Date;
};

export type TransactionFilter = {
  accountId?: string;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  search?: string;
};

export const TRANSACTION_TAGS = [
  "salary",
  "bonus",
  "gift",
  "refund",
  "groceries",
  "rent",
  "utilities",
  "transport",
  "food",
  "entertainment",
  "health",
  "education",
  "shopping",
  "travel",
  "other",
] as const;

export type TransactionTag = (typeof TRANSACTION_TAGS)[number];
