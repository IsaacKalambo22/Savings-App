import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Colors } from "@/constants/colors";
import { TransactionType } from "@/types/prisma";
import { TransactionWithAccount } from "@/types/transaction";
import {
  fromBigInt,
  getTransaction,
  reverseTransaction,
  deleteTransaction,
} from "@/features/transactions/services/transaction.service";
import { reloadAccounts, reloadTransactions } from "@/lib/hydrate";
import dayjs from "dayjs";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const [transaction, setTransaction] = useState<TransactionWithAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tx = await getTransaction(id);
        if (mounted) setTransaction(tx);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const refresh = async () => {
    await Promise.all([reloadAccounts(), reloadTransactions()]);
  };

  const handleReverse = () => {
    Alert.alert(
      "Reverse Transaction",
      "This creates an opposite transaction to cancel this one out. The original is preserved. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reverse",
          style: "destructive",
          onPress: async () => {
            if (busy) return;
            try {
              setBusy(true);
              await reverseTransaction(id);
              await refresh();
              router.back();
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to reverse");
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Transaction",
      "This soft-deletes the transaction (kept for audit history). Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (busy) return;
            try {
              setBusy(true);
              await deleteTransaction(id);
              await refresh();
              router.back();
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to delete");
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const getIconForType = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return "arrow-down-circle";
      case TransactionType.WITHDRAWAL:
        return "arrow-up-circle";
      case TransactionType.TRANSFER:
        return "swap-horizontal";
      default:
        return "receipt";
    }
  };

  const getColorForType = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return colors.success;
      case TransactionType.WITHDRAWAL:
        return colors.destructive;
      case TransactionType.TRANSFER:
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const formatAmount = (amount: bigint, type: TransactionType) => {
    const value = fromBigInt(amount);
    const sign = type === TransactionType.DEPOSIT ? "+" : "-";
    return `${sign} MK ${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.background }}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
        <Text className="text-base font-semibold mt-3" style={{ color: colors.text }}>
          Transaction not found
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-base font-semibold" style={{ color: colors.primary }}>
            Go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: colors.text }}>
          Transaction Details
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Amount Card */}
        <View
          className="p-6 rounded-xl mb-4 items-center"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: getColorForType(transaction.type) + "20" }}
          >
            <Ionicons
              name={getIconForType(transaction.type) as any}
              size={40}
              color={getColorForType(transaction.type)}
            />
          </View>
          <Text className="text-3xl font-bold" style={{ color: getColorForType(transaction.type) }}>
            {formatAmount(transaction.amount, transaction.type)}
          </Text>
          <Text className="text-base mt-2" style={{ color: colors.textSecondary }}>
            {transaction.type === TransactionType.DEPOSIT ? "Deposit" : transaction.type === TransactionType.WITHDRAWAL ? "Withdrawal" : "Transfer"}
          </Text>
          {transaction.isReversed && (
            <View className="mt-2 px-3 py-1 rounded-full" style={{ backgroundColor: colors.warning + "20" }}>
              <Text className="text-xs font-semibold" style={{ color: colors.warning }}>
                Reversed
              </Text>
            </View>
          )}
        </View>

        {/* Account */}
        <View
          className="p-4 rounded-xl mb-3"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Account
          </Text>
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: transaction.account.color + "20" }}
            >
              <Ionicons name={transaction.account.icon as any} size={20} color={transaction.account.color} />
            </View>
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              {transaction.account.name}
            </Text>
          </View>
        </View>

        {/* Date & Time */}
        <View
          className="p-4 rounded-xl mb-3"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Date & Time
          </Text>
          <Text className="text-base" style={{ color: colors.text }}>
            {dayjs(transaction.transactedAt).format("DD MMM YYYY, HH:mm")}
          </Text>
        </View>

        {/* Note */}
        {transaction.note && (
          <View
            className="p-4 rounded-xl mb-3"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Note
            </Text>
            <Text className="text-base" style={{ color: colors.text }}>
              {transaction.note}
            </Text>
          </View>
        )}

        {/* Tags */}
        {transaction.tags && transaction.tags.length > 0 && (
          <View
            className="p-4 rounded-xl mb-3"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Tags
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {transaction.tags.map((tag) => (
                <View
                  key={tag}
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: colors.primary + "20" }}
                >
                  <Text className="text-sm" style={{ color: colors.primary }}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions — Rule 13: corrections via reversal, never overwrite once recorded */}
        {!transaction.isReversed && (
          <View className="mt-6 gap-3">
            <TouchableOpacity
              onPress={() => router.push(`/transaction/edit?id=${transaction.id}`)}
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="create-outline" size={20} color={colors.primary} />
                <Text className="ml-2 text-base font-semibold" style={{ color: colors.primary }}>
                  Edit Transaction
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleReverse}
              disabled={busy}
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.warning + "20", borderColor: colors.warning, borderWidth: 1, opacity: busy ? 0.6 : 1 }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="refresh" size={20} color={colors.warning} />
                <Text className="ml-2 text-base font-semibold" style={{ color: colors.warning }}>
                  Reverse Transaction
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              disabled={busy}
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.destructive + "20", borderColor: colors.destructive, borderWidth: 1, opacity: busy ? 0.6 : 1 }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="trash" size={20} color={colors.destructive} />
                <Text className="ml-2 text-base font-semibold" style={{ color: colors.destructive }}>
                  Delete Transaction
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
