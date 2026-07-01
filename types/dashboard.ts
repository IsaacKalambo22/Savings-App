import { AccountWithBalance } from "./account";
import { TransactionWithAccount } from "./transaction";

export interface DashboardMetrics {
  totalSavings: number;
  todayDeposits: number;
  todayWithdrawals: number;
  monthlyDeposits: number;
  monthlyWithdrawals: number;
  largestAccount: AccountWithBalance | null;
  recentTransaction: TransactionWithAccount | null;
  totalAccounts: number;
  totalTransactions: number;
}

export interface DashboardCard {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface TimeRange {
  label: string;
  value: "today" | "week" | "month" | "year";
}
