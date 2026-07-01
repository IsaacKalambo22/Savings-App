import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/colors";
import { TransactionType } from "@/types/prisma";
import { AccountWithBalance } from "@/types/account";
import { SortOption } from "@/types/search";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedAccount?: string;
  onAccountChange: (accountId: string | undefined) => void;
  selectedType?: TransactionType;
  onTypeChange: (type: TransactionType | undefined) => void;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  accounts: AccountWithBalance[];
  onReset: () => void;
}

export function FilterModal({
  visible,
  onClose,
  selectedAccount,
  onAccountChange,
  selectedType,
  onTypeChange,
  sortBy,
  onSortChange,
  accounts,
  onReset,
}: FilterModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "amount-high", label: "Highest Amount" },
    { value: "amount-low", label: "Lowest Amount" },
  ];

  const transactionTypes: { value: TransactionType; label: string; icon: string }[] = [
    { value: TransactionType.DEPOSIT, label: "Deposit", icon: "arrow-down-circle" },
    { value: TransactionType.WITHDRAWAL, label: "Withdrawal", icon: "arrow-up-circle" },
    { value: TransactionType.TRANSFER, label: "Transfer", icon: "swap-horizontal" },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderColor: colors.border }}>
          <TouchableOpacity onPress={onReset}>
            <Text className="text-base font-semibold" style={{ color: colors.primary }}>
              Reset
            </Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            Filters
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-base font-semibold" style={{ color: colors.primary }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          {/* Sort By */}
          <View className="mb-6">
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>
              SORT BY
            </Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => onSortChange(option.value)}
                className="flex-row items-center justify-between p-4 rounded-xl mb-2"
                style={{
                  backgroundColor: sortBy === option.value ? colors.primary + "20" : colors.surface,
                  borderColor: sortBy === option.value ? colors.primary : colors.border,
                  borderWidth: 1,
                }}
              >
                <Text className="text-base" style={{ color: colors.text }}>
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Account Filter */}
          <View className="mb-6">
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>
              ACCOUNT
            </Text>
            <TouchableOpacity
              onPress={() => onAccountChange(undefined)}
              className="flex-row items-center justify-between p-4 rounded-xl mb-2"
              style={{
                backgroundColor: !selectedAccount ? colors.primary + "20" : colors.surface,
                borderColor: !selectedAccount ? colors.primary : colors.border,
                borderWidth: 1,
              }}
            >
              <Text className="text-base" style={{ color: colors.text }}>
                All Accounts
              </Text>
              {!selectedAccount && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
            </TouchableOpacity>
            {accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                onPress={() => onAccountChange(account.id)}
                className="flex-row items-center justify-between p-4 rounded-xl mb-2"
                style={{
                  backgroundColor: selectedAccount === account.id ? colors.primary + "20" : colors.surface,
                  borderColor: selectedAccount === account.id ? colors.primary : colors.border,
                  borderWidth: 1,
                }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: account.color + "20" }}
                  >
                    <Ionicons name={account.icon as any} size={16} color={account.color} />
                  </View>
                  <Text className="text-base" style={{ color: colors.text }}>
                    {account.name}
                  </Text>
                </View>
                {selectedAccount === account.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Transaction Type Filter */}
          <View className="mb-6">
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>
              TRANSACTION TYPE
            </Text>
            <TouchableOpacity
              onPress={() => onTypeChange(undefined)}
              className="flex-row items-center justify-between p-4 rounded-xl mb-2"
              style={{
                backgroundColor: !selectedType ? colors.primary + "20" : colors.surface,
                borderColor: !selectedType ? colors.primary : colors.border,
                borderWidth: 1,
              }}
            >
              <Text className="text-base" style={{ color: colors.text }}>
                All Types
              </Text>
              {!selectedType && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
            </TouchableOpacity>
            {transactionTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => onTypeChange(type.value)}
                className="flex-row items-center justify-between p-4 rounded-xl mb-2"
                style={{
                  backgroundColor: selectedType === type.value ? colors.primary + "20" : colors.surface,
                  borderColor: selectedType === type.value ? colors.primary : colors.border,
                  borderWidth: 1,
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons name={type.icon as any} size={20} color={colors.textSecondary} className="mr-3" />
                  <Text className="text-base" style={{ color: colors.text }}>
                    {type.label}
                  </Text>
                </View>
                {selectedType === type.value && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
