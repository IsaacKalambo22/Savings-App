import { AccountWithBalance } from "@/types/account";
import { TransactionWithAccount } from "@/types/transaction";
import { TransactionType } from "@/types/prisma";
import {
  MonthlySummary,
  AccountSummary,
  DepositReport,
  WithdrawalReport,
  TransferReport,
  SavingsGrowthData,
} from "@/types/report";
import { fromBigInt } from "@/features/transactions/services/transaction.service";
import dayjs from "dayjs";

/**
 * Generate monthly summary report
 */
export function generateMonthlySummary(
  transactions: TransactionWithAccount[],
  months: number = 12
): MonthlySummary[] {
  const summaries: Record<string, MonthlySummary> = {};

  transactions.forEach((t) => {
    const month = dayjs(t.transactedAt).format("YYYY-MM");
    const amount = fromBigInt(t.amount);

    if (!summaries[month]) {
      summaries[month] = {
        month,
        totalDeposits: 0,
        totalWithdrawals: 0,
        netChange: 0,
        transactionCount: 0,
        averageDeposit: 0,
        averageWithdrawal: 0,
      };
    }

    if (t.type === TransactionType.DEPOSIT) {
      summaries[month].totalDeposits += amount;
    } else if (t.type === TransactionType.WITHDRAWAL) {
      summaries[month].totalWithdrawals += amount;
    }

    summaries[month].transactionCount++;
  });

  // Calculate averages and net change
  Object.values(summaries).forEach((summary) => {
    summary.netChange = summary.totalDeposits - summary.totalWithdrawals;
    const depositCount = transactions.filter(
      (t) => dayjs(t.transactedAt).format("YYYY-MM") === summary.month &&
      t.type === TransactionType.DEPOSIT
    ).length;
    const withdrawalCount = transactions.filter(
      (t) => dayjs(t.transactedAt).format("YYYY-MM") === summary.month &&
      t.type === TransactionType.WITHDRAWAL
    ).length;

    summary.averageDeposit = depositCount > 0 ? summary.totalDeposits / depositCount : 0;
    summary.averageWithdrawal = withdrawalCount > 0 ? summary.totalWithdrawals / withdrawalCount : 0;
  });

  // Return sorted by month (most recent first)
  return Object.values(summaries)
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, months);
}

/**
 * Generate account summary report
 */
export function generateAccountSummary(
  accounts: AccountWithBalance[],
  transactions: TransactionWithAccount[]
): AccountSummary[] {
  return accounts.map((account) => {
    const accountTransactions = transactions.filter((t) => t.accountId === account.id);
    const deposits = accountTransactions.filter((t) => t.type === TransactionType.DEPOSIT);
    const withdrawals = accountTransactions.filter((t) => t.type === TransactionType.WITHDRAWAL);

    return {
      account,
      totalDeposits: deposits.reduce((sum, t) => sum + fromBigInt(t.amount), 0),
      totalWithdrawals: withdrawals.reduce((sum, t) => sum + fromBigInt(t.amount), 0),
      transactionCount: accountTransactions.length,
      largestDeposit: deposits.length > 0
        ? Math.max(...deposits.map((t) => fromBigInt(t.amount)))
        : 0,
      largestWithdrawal: withdrawals.length > 0
        ? Math.max(...withdrawals.map((t) => fromBigInt(t.amount)))
        : 0,
    };
  });
}

/**
 * Generate deposit report
 */
export function generateDepositReport(
  transactions: TransactionWithAccount[]
): DepositReport {
  const deposits = transactions.filter((t) => t.type === TransactionType.DEPOSIT);
  const totalAmount = deposits.reduce((sum, t) => sum + fromBigInt(t.amount), 0);
  const averageAmount = deposits.length > 0 ? totalAmount / deposits.length : 0;

  const byAccount: Record<string, number> = {};
  const byMonth: Record<string, number> = {};

  deposits.forEach((t) => {
    byAccount[t.accountId] = (byAccount[t.accountId] || 0) + fromBigInt(t.amount);
    const month = dayjs(t.transactedAt).format("YYYY-MM");
    byMonth[month] = (byMonth[month] || 0) + fromBigInt(t.amount);
  });

  return {
    transactions: deposits,
    totalAmount,
    averageAmount,
    byAccount,
    byMonth,
  };
}

/**
 * Generate withdrawal report
 */
export function generateWithdrawalReport(
  transactions: TransactionWithAccount[]
): WithdrawalReport {
  const withdrawals = transactions.filter((t) => t.type === TransactionType.WITHDRAWAL);
  const totalAmount = withdrawals.reduce((sum, t) => sum + fromBigInt(t.amount), 0);
  const averageAmount = withdrawals.length > 0 ? totalAmount / withdrawals.length : 0;

  const byAccount: Record<string, number> = {};
  const byMonth: Record<string, number> = {};

  withdrawals.forEach((t) => {
    byAccount[t.accountId] = (byAccount[t.accountId] || 0) + fromBigInt(t.amount);
    const month = dayjs(t.transactedAt).format("YYYY-MM");
    byMonth[month] = (byMonth[month] || 0) + fromBigInt(t.amount);
  });

  return {
    transactions: withdrawals,
    totalAmount,
    averageAmount,
    byAccount,
    byMonth,
  };
}

/**
 * Generate transfer report
 */
export function generateTransferReport(
  transactions: TransactionWithAccount[],
  accounts: AccountWithBalance[]
): TransferReport {
  // Group transactions by transfer pairs (withdrawal + deposit)
  const transferPairs: Array<{
    fromAccount: AccountWithBalance;
    toAccount: AccountWithBalance;
    amount: number;
    date: Date;
  }> = [];

  const byAccount: Record<string, number> = {};

  // Simple implementation - look for TRANSFER type transactions
  const transferTransactions = transactions.filter((t) => t.type === TransactionType.TRANSFER);

  transferTransactions.forEach((t) => {
    const account = accounts.find((a) => a.id === t.accountId);
    if (account) {
      byAccount[account.id] = (byAccount[account.id] || 0) + fromBigInt(t.amount);
    }
  });

  return {
    transfers: transferPairs,
    totalTransferred: Object.values(byAccount).reduce((sum, val) => sum + val, 0),
    byAccount,
  };
}

/**
 * Generate savings growth data for charts
 */
export function generateSavingsGrowth(
  accounts: AccountWithBalance[],
  transactions: TransactionWithAccount[]
): SavingsGrowthData[] {
  const growthData: SavingsGrowthData[] = [];
  const sortedTransactions = [...transactions].sort(
    (a, b) => a.transactedAt.getTime() - b.transactedAt.getTime()
  );

  let runningBalance = 0;
  const monthlyData: Record<string, SavingsGrowthData> = {};

  sortedTransactions.forEach((t) => {
    const month = dayjs(t.transactedAt).format("YYYY-MM");
    const amount = fromBigInt(t.amount);

    if (!monthlyData[month]) {
      monthlyData[month] = {
        date: dayjs(t.transactedAt).toDate(),
        balance: runningBalance,
        deposits: 0,
        withdrawals: 0,
      };
    }

    if (t.type === TransactionType.DEPOSIT) {
      runningBalance += amount;
      monthlyData[month].deposits += amount;
    } else if (t.type === TransactionType.WITHDRAWAL) {
      runningBalance -= amount;
      monthlyData[month].withdrawals += amount;
    }

    monthlyData[month].balance = runningBalance;
  });

  return Object.values(monthlyData).sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Format currency for reports
 */
export function formatReportCurrency(amount: number): string {
  return `MK ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
