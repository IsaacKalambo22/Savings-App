import { Account, AccountStatus } from "./prisma";

export type { Account };

export type AccountWithBalance = Account & {
  balance: bigint;
  transactionCount: number;
};

export type AccountFormData = {
  name: string;
  description?: string;
  icon: string;
  color: string;
  status: AccountStatus;
};

export type AccountFilter = {
  status?: AccountStatus;
  search?: string;
};

export const ACCOUNT_ICONS = [
  "piggy-bank",
  "wallet",
  "home",
  "briefcase",
  "user",
  "heart",
  "shopping-cart",
  "coins",
  "car",
  "airplane",
  "school",
  "medical",
  "restaurant",
  "gift",
  "star",
  "shield",
  "leaf",
  "bolt",
  "flame",
  "diamond",
] as const;

export type AccountIcon = (typeof ACCOUNT_ICONS)[number];
