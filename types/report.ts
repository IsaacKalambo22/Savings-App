import { AccountWithBalance } from "./account";
import { TransactionWithAccount } from "./transaction";
import { TransactionType } from "./prisma";

export interface MonthlySummary {
  month: string; // Format: "YYYY-MM"
  totalDeposits: number;
  totalWithdrawals: number;
  netChange: number;
  transactionCount: number;
  averageDeposit: number;
  averageWithdrawal: number;
}

export interface AccountSummary {
  account: AccountWithBalance;
  totalDeposits: number;
  totalWithdrawals: number;
  transactionCount: number;
  largestDeposit: number;
  largestWithdrawal: number;
}

export interface DepositReport {
  transactions: TransactionWithAccount[];
  totalAmount: number;
  averageAmount: number;
  byAccount: Record<string, number>;
  byMonth: Record<string, number>;
}

export interface WithdrawalReport {
  transactions: TransactionWithAccount[];
  totalAmount: number;
  averageAmount: number;
  byAccount: Record<string, number>;
  byMonth: Record<string, number>;
}

export interface TransferReport {
  transfers: Array<{
    fromAccount: AccountWithBalance;
    toAccount: AccountWithBalance;
    amount: number;
    date: Date;
  }>;
  totalTransferred: number;
  byAccount: Record<string, number>;
}

export interface ChartData {
  label: string;
  value: number;
  date?: Date;
}

export interface SavingsGrowthData {
  date: Date;
  balance: number;
  deposits: number;
  withdrawals: number;
}
