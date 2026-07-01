import { AccountWithBalance } from "@/types/account";
import { TransactionWithAccount } from "@/types/transaction";
import { TransactionType } from "@/types/prisma";
import { DashboardMetrics } from "@/types/dashboard";
import { fromBigInt } from "@/features/transactions/services/transaction.service";
import dayjs from "dayjs";

/**
 * Calculate dashboard metrics
 * Rule 5: Automatic calculations only
 * Rule 17: Dashboard metrics are read-only
 */
export async function getDashboardMetrics(
  accounts: AccountWithBalance[],
  transactions: TransactionWithAccount[]
): Promise<DashboardMetrics> {
  const now = dayjs();
  const startOfDay = now.startOf("day");
  const startOfMonth = now.startOf("month");

  // Total Savings (sum of all account balances)
  const totalSavings = accounts.reduce((sum, acc) => sum + fromBigInt(acc.balance), 0);

  // Today's transactions
  const todayTransactions = transactions.filter((t) =>
    dayjs(t.transactedAt).isAfter(startOfDay)
  );

  const todayDeposits = todayTransactions
    .filter((t) => t.type === TransactionType.DEPOSIT)
    .reduce((sum, t) => sum + fromBigInt(t.amount), 0);

  const todayWithdrawals = todayTransactions
    .filter((t) => t.type === TransactionType.WITHDRAWAL)
    .reduce((sum, t) => sum + fromBigInt(t.amount), 0);

  // Monthly transactions
  const monthlyTransactions = transactions.filter((t) =>
    dayjs(t.transactedAt).isAfter(startOfMonth)
  );

  const monthlyDeposits = monthlyTransactions
    .filter((t) => t.type === TransactionType.DEPOSIT)
    .reduce((sum, t) => sum + fromBigInt(t.amount), 0);

  const monthlyWithdrawals = monthlyTransactions
    .filter((t) => t.type === TransactionType.WITHDRAWAL)
    .reduce((sum, t) => sum + fromBigInt(t.amount), 0);

  // Largest account
  const largestAccount = accounts.length > 0
    ? accounts.reduce((max, acc) =>
        fromBigInt(acc.balance) > fromBigInt(max.balance) ? acc : max
      )
    : null;

  // Recent transaction
  const recentTransaction = transactions.length > 0 ? transactions[0] : null;

  return {
    totalSavings,
    todayDeposits,
    todayWithdrawals,
    monthlyDeposits,
    monthlyWithdrawals,
    largestAccount,
    recentTransaction,
    totalAccounts: accounts.length,
    totalTransactions: transactions.length,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `MK ${amount.toLocaleString()}`;
}

/**
 * Format percentage change
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
