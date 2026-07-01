import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTransactionStore } from "@/features/transactions/store/transaction.store";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/colors";
import { TransactionType } from "@/types/prisma";
import { fromBigInt } from "@/features/transactions/services/transaction.service";
import dayjs from "dayjs";

export default function TransactionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const { filteredTransactions } = useTransactionStore();

  const formatAmount = (amount: bigint, type: TransactionType) => {
    const value = fromBigInt(amount);
    const sign = type === TransactionType.DEPOSIT ? "+" : "-";
    return `${sign} MK ${value.toLocaleString()}`;
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

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between px-4 py-4">
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Transactions
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/transaction/add")}
          className="rounded-full w-9 h-9 items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        {filteredTransactions.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="swap-horizontal-outline" size={48} color={colors.textSecondary} />
            <Text className="text-base font-semibold mt-3" style={{ color: colors.textSecondary }}>
              No transactions yet
            </Text>
            <Text className="text-sm mt-1 text-center" style={{ color: colors.textTertiary }}>
              Record your first deposit or withdrawal.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {filteredTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                className="p-4 rounded-xl"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: getColorForType(transaction.type) + "20" }}
                  >
                    <Ionicons
                      name={getIconForType(transaction.type) as any}
                      size={24}
                      color={getColorForType(transaction.type)}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold" style={{ color: colors.text }}>
                      {transaction.account.name}
                    </Text>
                    <Text className="text-sm" style={{ color: colors.textSecondary }}>
                      {dayjs(transaction.transactedAt).format("DD MMM YYYY")}
                    </Text>
                    {transaction.note && (
                      <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                        {transaction.note}
                      </Text>
                    )}
                  </View>
                  <Text
                    className="text-lg font-bold"
                    style={{ color: getColorForType(transaction.type) }}
                  >
                    {formatAmount(transaction.amount, transaction.type)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
