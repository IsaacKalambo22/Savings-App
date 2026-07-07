import { View, Text, ScrollView, TouchableOpacity , useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { LineChart, GroupedBarChart, DonutChart } from "@/components/charts";
import { fromBigInt } from "@/features/transactions/services/transaction.service";

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const { monthlySummaries, savingsGrowth, setMonthlySummaries, setAccountSummaries, setDepositReport, setWithdrawalReport, setSavingsGrowth } = useReportStore();
  const { activeAccounts } = useAccountStore();
  const { filteredTransactions } = useTransactionStore();
  const [selectedReport, setSelectedReport] = useState<string>("monthly");

  // Savings growth (line) — running balance per month, chronological.
  const growth = useMemo(() => {
    const points = savingsGrowth.slice(-6);
    return {
      data: points.map((p) => p.balance),
      labels: points.map((p) => dayjs(p.date).format("MMM")),
    };
  }, [savingsGrowth]);

  // Monthly deposits vs withdrawals (grouped bars) — last 6 months chronological.
  const monthlyBars = useMemo(() => {
    const months = [...monthlySummaries].sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
    return {
      groups: months.map((m) => [m.totalDeposits, m.totalWithdrawals]),
      labels: months.map((m) => dayjs(m.month).format("MMM")),
    };
  }, [monthlySummaries]);

  // Account distribution (donut) — accounts with a positive balance.
  const distribution = useMemo(() => {
    return activeAccounts
      .map((a) => ({ value: Math.max(0, fromBigInt(a.balance)), color: a.color, name: a.name }))
      .filter((s) => s.value > 0);
  }, [activeAccounts]);

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
            {/* Savings Growth */}
            {growth.data.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  SAVINGS GROWTH
                </Text>
                <View
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
                >
                  <LineChart
                    data={growth.data}
                    labels={growth.labels}
                    color={colors.primary}
                    gridColor={colors.border}
                    labelColor={colors.textTertiary}
                  />
                </View>
              </View>
            )}

            {/* Monthly Deposits vs Withdrawals */}
            {monthlyBars.groups.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  DEPOSITS VS WITHDRAWALS
                </Text>
                <View
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
                >
                  <GroupedBarChart
                    groups={monthlyBars.groups}
                    labels={monthlyBars.labels}
                    colors={[colors.success, colors.destructive]}
                    gridColor={colors.border}
                    labelColor={colors.textTertiary}
                  />
                  <View className="flex-row justify-center gap-4 mt-2">
                    <View className="flex-row items-center">
                      <View className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: colors.success }} />
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>Deposits</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: colors.destructive }} />
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>Withdrawals</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Account Distribution */}
            {distribution.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  ACCOUNT DISTRIBUTION
                </Text>
                <View
                  className="p-4 rounded-xl flex-row items-center"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
                >
                  <DonutChart
                    segments={distribution.map((s) => ({ value: s.value, color: s.color }))}
                    trackColor={colors.border}
                    centerLabel={`${distribution.length}`}
                    centerColor={colors.text}
                  />
                  <View className="flex-1 ml-4 gap-2">
                    {distribution.slice(0, 6).map((s) => (
                      <View key={s.name} className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: s.color }} />
                          <Text className="text-xs" style={{ color: colors.text }} numberOfLines={1}>
                            {s.name}
                          </Text>
                        </View>
                        <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                          {formatReportCurrency(s.value)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

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
