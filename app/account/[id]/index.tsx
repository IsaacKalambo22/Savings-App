import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { AccountStatus, TransactionType } from "@/types/prisma";
import { AccountWithBalance } from "@/types/account";
import { TransactionWithAccount } from "@/types/transaction";
import { getAccountWithBalance, restoreAccount } from "@/features/accounts/services/account.service";
import { fromBigInt, getTransactions } from "@/features/transactions/services/transaction.service";
import { reloadAccounts } from "@/lib/hydrate";
import dayjs from "dayjs";

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const [account, setAccount] = useState<AccountWithBalance | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const [acc, txns] = await Promise.all([
            getAccountWithBalance(id),
            getTransactions(id),
          ]);
          if (mounted) {
            setAccount(acc);
            setTransactions(txns);
          }
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [id])
  );

  const handleRestore = async () => {
    await restoreAccount(id);
    await reloadAccounts();
    const acc = await getAccountWithBalance(id);
    setAccount(acc);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!account) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.background }}>
        <Ionicons name="wallet-outline" size={48} color={colors.textSecondary} />
        <Text className="text-base font-semibold mt-3" style={{ color: colors.text }}>Account not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-base font-semibold" style={{ color: colors.primary }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isArchived = account.status === AccountStatus.ARCHIVED;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: colors.text }} numberOfLines={1}>
          {account.name}
        </Text>
        <TouchableOpacity onPress={() => router.push(`/account/${id}/edit`)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Balance card */}
        <View className="rounded-2xl p-6 my-4 items-center" style={{ backgroundColor: account.color }}>
          <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <Ionicons name={account.icon as any} size={28} color="#fff" />
          </View>
          <Text className="text-sm text-white/80">Balance</Text>
          <Text className="text-3xl font-bold text-white mt-1">
            MK {fromBigInt(account.balance).toLocaleString()}
          </Text>
          {account.description ? (
            <Text className="text-sm text-white/70 mt-2 text-center">{account.description}</Text>
          ) : null}
          <View className="flex-row items-center mt-3 px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <Text className="text-xs text-white">
              {account.transactionCount} transaction{account.transactionCount === 1 ? "" : "s"}
              {isArchived ? " · Archived" : ""}
            </Text>
          </View>
        </View>

        {/* Archived banner + restore */}
        {isArchived && (
          <TouchableOpacity
            onPress={handleRestore}
            className="p-4 rounded-xl mb-4 flex-row items-center justify-center"
            style={{ backgroundColor: colors.primary + "20", borderColor: colors.primary, borderWidth: 1 }}
          >
            <Ionicons name="refresh" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
              Restore Account
            </Text>
          </TouchableOpacity>
        )}

        {/* Quick actions */}
        {!isArchived && (
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={() => router.push("/transaction/add?type=deposit")}
              className="flex-1 p-3 rounded-xl items-center"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Ionicons name="arrow-down-circle" size={22} color={colors.success} />
              <Text className="text-xs font-semibold mt-1" style={{ color: colors.text }}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/transaction/add?type=withdrawal")}
              className="flex-1 p-3 rounded-xl items-center"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Ionicons name="arrow-up-circle" size={22} color={colors.destructive} />
              <Text className="text-xs font-semibold mt-1" style={{ color: colors.text }}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/transaction/transfer")}
              className="flex-1 p-3 rounded-xl items-center"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Ionicons name="swap-horizontal" size={22} color={colors.primary} />
              <Text className="text-xs font-semibold mt-1" style={{ color: colors.text }}>Transfer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History */}
        <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
          HISTORY
        </Text>
        {transactions.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="receipt-outline" size={40} color={colors.textSecondary} />
            <Text className="text-sm mt-2" style={{ color: colors.textSecondary }}>
              No transactions yet
            </Text>
          </View>
        ) : (
          <View className="gap-2 mb-8">
            {transactions.map((t) => {
              const isDeposit = t.type === TransactionType.DEPOSIT;
              const color = isDeposit ? colors.success : colors.destructive;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => router.push(`/transaction/${t.id}`)}
                  className="p-4 rounded-xl flex-row items-center"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, opacity: t.isReversed ? 0.55 : 1 }}
                >
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: color + "20" }}>
                    <Ionicons name={isDeposit ? "arrow-down" : "arrow-up"} size={18} color={color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                      {isDeposit ? "Deposit" : t.type === TransactionType.WITHDRAWAL ? "Withdrawal" : "Transfer"}
                      {t.isReversed ? " · Reversed" : ""}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      {dayjs(t.transactedAt).format("DD MMM YYYY • HH:mm")}
                    </Text>
                    {t.note ? (
                      <Text className="text-xs mt-0.5" style={{ color: colors.textTertiary }} numberOfLines={1}>
                        {t.note}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="text-base font-bold" style={{ color }}>
                    {isDeposit ? "+" : "-"} MK {fromBigInt(t.amount).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
