import { create } from "zustand";
import {
  MonthlySummary,
  AccountSummary,
  DepositReport,
  WithdrawalReport,
  TransferReport,
  SavingsGrowthData,
} from "@/types/report";

interface ReportState {
  monthlySummaries: MonthlySummary[];
  accountSummaries: AccountSummary[];
  depositReport: DepositReport | null;
  withdrawalReport: WithdrawalReport | null;
  transferReport: TransferReport | null;
  savingsGrowth: SavingsGrowthData[];
  isLoading: boolean;
  selectedMonth: string | null;

  setMonthlySummaries: (summaries: MonthlySummary[]) => void;
  setAccountSummaries: (summaries: AccountSummary[]) => void;
  setDepositReport: (report: DepositReport) => void;
  setWithdrawalReport: (report: WithdrawalReport) => void;
  setTransferReport: (report: TransferReport) => void;
  setSavingsGrowth: (data: SavingsGrowthData[]) => void;
  setLoading: (loading: boolean) => void;
  setSelectedMonth: (month: string | null) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  monthlySummaries: [],
  accountSummaries: [],
  depositReport: null,
  withdrawalReport: null,
  transferReport: null,
  savingsGrowth: [],
  isLoading: false,
  selectedMonth: null,

  setMonthlySummaries: (monthlySummaries) => set({ monthlySummaries }),
  setAccountSummaries: (accountSummaries) => set({ accountSummaries }),
  setDepositReport: (depositReport) => set({ depositReport }),
  setWithdrawalReport: (withdrawalReport) => set({ withdrawalReport }),
  setTransferReport: (transferReport) => set({ transferReport }),
  setSavingsGrowth: (savingsGrowth) => set({ savingsGrowth }),
  setLoading: (isLoading) => set({ isLoading }),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
}));
