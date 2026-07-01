import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/colors";
import { useReportStore } from "@/features/reports/store/report.store";
import { useAccountStore } from "@/features/accounts/store/account.store";
import { useTransactionStore } from "@/features/transactions/store/transaction.store";
import {
  generateMonthlySummary,
  generateAccountSummary,
  generateDepositReport,
  generateWithdrawalReport,
  generateSavingsGrowth,
  formatReportCurrency,
} from "@/features/reports/services/report.service";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const { monthlySummaries, setMonthlySummaries, setAccountSummaries, setDepositReport, setWithdrawalReport, setSavingsGrowth } = useReportStore();
  const { activeAccounts } = useAccountStore();
  const { filteredTransactions } = useTransactionStore();
  const [selectedReport, setSelectedReport] = useState<string>("monthly");

  useEffect(() => {
    const loadReports = () => {
      const monthly = generateMonthlySummary(filteredTransactions);
      const account = generateAccountSummary(activeAccounts, filteredTransactions);
      const deposit = generateDepositReport(filteredTransactions);
      const withdrawal = generateWithdrawalReport(filteredTransactions);
      const growth = generateSavingsGrowth(activeAccounts, filteredTransactions);

      setMonthlySummaries(monthly);
      setAccountSummaries(account);
      setDepositReport(deposit);
      setWithdrawalReport(withdrawal);
      setSavingsGrowth(growth);
    };
    loadReports();
  }, [activeAccounts, filteredTransactions]);

  const ReportCard = ({ title, value, subtitle, icon, color, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      className="p-4 rounded-xl mb-3"
      style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
    >
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: color + "20" }}
        >
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
            {title}
          </Text>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            {value}
          </Text>
          {subtitle && (
            <Text className="text-xs" style={{ color: colors.textTertiary }}>
              {subtitle}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="px-4 py-4">
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Reports
        </Text>
      </View>

      <ScrollView className="flex-1 px-4">
        {filteredTransactions.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
            <Text className="text-base font-semibold mt-3" style={{ color: colors.textSecondary }}>
              No reports yet
            </Text>
            <Text className="text-sm mt-1 text-center" style={{ color: colors.textTertiary }}>
              Reports are generated automatically from your transactions.
            </Text>
          </View>
        ) : (
          <>
            {/* Monthly Summary */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                MONTHLY SUMMARY
              </Text>
              {monthlySummaries.length > 0 ? (
                monthlySummaries.slice(0, 3).map((summary) => (
                  <View
                    key={summary.month}
                    className="p-4 rounded-xl mb-2"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
                  >
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-base font-semibold" style={{ color: colors.text }}>
                        {dayjs(summary.month).format("MMMM YYYY")}
                      </Text>
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: summary.netChange >= 0 ? colors.success : colors.destructive }}
                      >
                        {summary.netChange >= 0 ? "+" : ""}
                        {formatReportCurrency(summary.netChange)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <View>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                          Deposits
                        </Text>
                        <Text className="text-sm font-semibold" style={{ color: colors.success }}>
                          {formatReportCurrency(summary.totalDeposits)}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                          Withdrawals
                        </Text>
                        <Text className="text-sm font-semibold" style={{ color: colors.destructive }}>
                          {formatReportCurrency(summary.totalWithdrawals)}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                          Transactions
                        </Text>
                        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                          {summary.transactionCount}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-sm" style={{ color: colors.textTertiary }}>
                  No monthly data available
                </Text>
              )}
            </View>

            {/* Quick Stats */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                QUICK STATS
              </Text>
              <ReportCard
                title="Total Deposits"
                value={formatReportCurrency(
                  filteredTransactions
                    .filter((t) => t.type === "DEPOSIT")
                    .reduce((sum, t) => sum + Number(t.amount) / 100, 0)
                )}
                icon="arrow-down-circle"
                color={colors.success}
              />
              <ReportCard
                title="Total Withdrawals"
                value={formatReportCurrency(
                  filteredTransactions
                    .filter((t) => t.type === "WITHDRAWAL")
                    .reduce((sum, t) => sum + Number(t.amount) / 100, 0)
                )}
                icon="arrow-up-circle"
                color={colors.destructive}
              />
              <ReportCard
                title="Total Transactions"
                value={filteredTransactions.length.toString()}
                subtitle="All time"
                icon="receipt"
                color={colors.primary}
              />
            </View>

            {/* Account Breakdown */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                ACCOUNT BREAKDOWN
              </Text>
              {activeAccounts.map((account) => {
                const accountTransactions = filteredTransactions.filter((t) => t.accountId === account.id);
                const deposits = accountTransactions.filter((t) => t.type === "DEPOSIT");
                const withdrawals = accountTransactions.filter((t) => t.type === "WITHDRAWAL");
                const totalDeposits = deposits.reduce((sum, t) => sum + Number(t.amount) / 100, 0);
                const totalWithdrawals = withdrawals.reduce((sum, t) => sum + Number(t.amount) / 100, 0);

                return (
                  <View
                    key={account.id}
                    className="p-4 rounded-xl mb-2"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
                  >
                    <View className="flex-row items-center mb-2">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: account.color + "20" }}
                      >
                        <Ionicons name={account.icon as any} size={20} color={account.color} />
                      </View>
                      <Text className="text-base font-semibold" style={{ color: colors.text }}>
                        {account.name}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <View>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                          Deposits
                        </Text>
                        <Text className="text-sm font-semibold" style={{ color: colors.success }}>
                          {formatReportCurrency(totalDeposits)}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                          Withdrawals
                        </Text>
                        <Text className="text-sm font-semibold" style={{ color: colors.destructive }}>
                          {formatReportCurrency(totalWithdrawals)}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                          Transactions
                        </Text>
                        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                          {accountTransactions.length}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
