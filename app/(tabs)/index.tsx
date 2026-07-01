import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/colors";
import { useDashboardStore } from "@/features/dashboard/store/dashboard.store";
import { useAccountStore } from "@/features/accounts/store/account.store";
import { useTransactionStore } from "@/features/transactions/store/transaction.store";
import { getDashboardMetrics, formatCurrency } from "@/features/dashboard/services/dashboard.service";
import { fromBigInt } from "@/features/transactions/services/transaction.service";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

export default function DashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const { metrics, setMetrics, setLoading } = useDashboardStore();
  const { activeAccounts } = useAccountStore();
  const { filteredTransactions } = useTransactionStore();

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      const calculatedMetrics = await getDashboardMetrics(activeAccounts, filteredTransactions);
      setMetrics(calculatedMetrics);
      setLoading(false);
    };
    loadMetrics();
  }, [activeAccounts, filteredTransactions]);

  const MetricCard = ({ title, value, subtitle, icon, color, trend, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      className="p-4 rounded-xl flex-1"
      style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
            {title}
          </Text>
          <Text className="text-xl font-bold" style={{ color: colors.text }}>
            {value}
          </Text>
        </View>
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: color + "20" }}
        >
          <Ionicons name={icon} size={20} color={color} />
        </View>
      </View>
      {subtitle && (
        <View className="flex-row items-center mt-1">
          {trend && (
            <Ionicons
              name={trend === "up" ? "arrow-up" : "arrow-down"}
              size={14}
              color={color}
              style={{ marginRight: 4 }}
            />
          )}
          <Text className="text-xs" style={{ color: colors.textTertiary }}>
            {subtitle}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1 px-4">
        <View className="py-6">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            NestKeep
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Your household savings, organised.
          </Text>
        </View>

        {/* Total Savings Card */}
        <View
          className="rounded-2xl p-6 mb-4"
          style={{
            backgroundColor: colors.primary,
          }}
        >
          <Text className="text-sm font-medium text-white/80">Total Savings</Text>
          <Text className="text-4xl font-bold text-white mt-1">
            {metrics ? formatCurrency(metrics.totalSavings) : "MK 0.00"}
          </Text>
          <Text className="text-xs text-white/60 mt-2">
            {metrics?.totalAccounts || 0} active accounts
          </Text>
        </View>

        {/* Today's Metrics */}
        <View className="flex-row gap-3 mb-4">
          <MetricCard
            title="Today's Deposits"
            value={metrics ? formatCurrency(metrics.todayDeposits ?? 0) : "MK 0.00"}
            subtitle={(metrics?.todayDeposits ?? 0) > 0 ? "Today" : "No deposits"}
            icon="arrow-down-circle"
            color={colors.success}
            trend={(metrics?.todayDeposits ?? 0) > 0 ? "up" : undefined}
          />
          <MetricCard
            title="Today's Withdrawals"
            value={metrics ? formatCurrency(metrics.todayWithdrawals ?? 0) : "MK 0.00"}
            subtitle={(metrics?.todayWithdrawals ?? 0) > 0 ? "Today" : "No withdrawals"}
            icon="arrow-up-circle"
            color={colors.destructive}
            trend={(metrics?.todayWithdrawals ?? 0) > 0 ? "down" : undefined}
          />
        </View>

        {/* Monthly Metrics */}
        <View className="flex-row gap-3 mb-4">
          <MetricCard
            title="This Month Deposits"
            value={metrics ? formatCurrency(metrics.monthlyDeposits ?? 0) : "MK 0.00"}
            subtitle={(metrics?.monthlyDeposits ?? 0) > 0 ? "This month" : "No deposits"}
            icon="trending-up"
            color={colors.success}
            trend={(metrics?.monthlyDeposits ?? 0) > 0 ? "up" : undefined}
          />
          <MetricCard
            title="This Month Withdrawals"
            value={metrics ? formatCurrency(metrics.monthlyWithdrawals ?? 0) : "MK 0.00"}
            subtitle={(metrics?.monthlyWithdrawals ?? 0) > 0 ? "This month" : "No withdrawals"}
            icon="trending-down"
            color={colors.destructive}
            trend={(metrics?.monthlyWithdrawals ?? 0) > 0 ? "down" : undefined}
          />
        </View>

        {/* Largest Account */}
        {metrics?.largestAccount && (
          <TouchableOpacity
            onPress={() => router.push("/accounts")}
            className="p-4 rounded-xl mb-4"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: metrics.largestAccount.color + "20" }}
              >
                <Ionicons name={metrics.largestAccount.icon as any} size={24} color={metrics.largestAccount.color} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                  Largest Account
                </Text>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  {metrics.largestAccount.name}
                </Text>
              </View>
              <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                {formatCurrency(fromBigInt(metrics.largestAccount.balance))}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Recent Transaction */}
        {metrics?.recentTransaction ? (() => {
          const recentTx = metrics.recentTransaction;
          return (
            <TouchableOpacity
              onPress={() => router.push(`/transaction/${recentTx.id}`)}
              className="p-4 rounded-xl mb-4"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  Recent Transaction
                </Text>
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  {dayjs(recentTx.transactedAt).format("DD MMM")}
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-base font-semibold" style={{ color: colors.text }}>
                    {recentTx.account.name}
                  </Text>
                  {recentTx.note && (
                    <Text className="text-sm" style={{ color: colors.textSecondary }}>
                      {recentTx.note}
                    </Text>
                  )}
                </View>
                <Text
                  className="text-lg font-bold"
                  style={{
                    color:
                      recentTx.type === "DEPOSIT"
                        ? colors.success
                        : colors.destructive,
                  }}
                >
                  {recentTx.type === "DEPOSIT" ? "+" : "-"}{" "}
                  {formatCurrency(fromBigInt(recentTx.amount))}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })() : (
          <View
            className="p-4 rounded-xl mb-4 items-center"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <Ionicons name="receipt-outline" size={32} color={colors.textSecondary} />
            <Text className="text-sm mt-2" style={{ color: colors.textSecondary }}>
              No transactions yet
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
