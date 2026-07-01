import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { TransactionType } from "@/types/prisma";
import { fromBigInt } from "@/features/transactions/services/transaction.service";
import dayjs from "dayjs";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  // TODO: Fetch transaction details from store/service
  const transaction = {
    id,
    type: TransactionType.DEPOSIT,
    amount: BigInt(500000),
    note: "Salary payment",
    tags: ["salary"],
    transactedAt: new Date(),
    isReversed: false,
    account: {
      id: "1",
      name: "Joint",
      icon: "users",
      color: "#0A63E0",
    },
  };

  const handleReverse = () => {
    Alert.alert(
      "Reverse Transaction",
      "This will create a reversal transaction. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reverse",
          style: "destructive",
          onPress: () => {
            // TODO: Call reversal service
            console.log("Reversing transaction:", id);
            Alert.alert("Success", "Transaction reversed");
            router.back();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Transaction",
      "This will soft delete the transaction. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // TODO: Call delete service
            console.log("Deleting transaction:", id);
            Alert.alert("Success", "Transaction deleted");
            router.back();
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

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: colors.text }}>
          Transaction Details
        </Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
        </TouchableOpacity>
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

        {/* Actions */}
        {!transaction.isReversed && (
          <View className="mt-6 gap-3">
            <TouchableOpacity
              onPress={handleReverse}
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.warning + "20", borderColor: colors.warning, borderWidth: 1 }}
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
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.destructive + "20", borderColor: colors.destructive, borderWidth: 1 }}
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
