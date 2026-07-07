import { View, Text, ScrollView, TouchableOpacity , useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTransactionStore } from "@/features/transactions/store/transaction.store";
import { useAccountStore } from "@/features/accounts/store/account.store";
import { Colors } from "@/constants/colors";
import { TransactionType } from "@/types/prisma";
import { fromBigInt } from "@/features/transactions/services/transaction.service";
import dayjs from "dayjs";
import { SearchBar } from "@/components/search-bar";
import { FilterModal } from "@/components/filter-modal";
import { useState } from "react";

export default function TransactionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const { filteredTransactions, searchFilters, setSearchFilters, sortBy, setSortBy, resetSearchFilters } = useTransactionStore();
  const { activeAccounts } = useAccountStore();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchFilters.searchQuery || "");

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

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setSearchFilters({ searchQuery: text });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchFilters({ searchQuery: "" });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    resetSearchFilters();
    setShowFilterModal(false);
  };

  const hasActiveFilters = searchFilters.accountId || searchFilters.type || sortBy !== "newest";

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between px-4 py-4">
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Transactions
        </Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            className="rounded-full w-9 h-9 items-center justify-center"
            style={{ backgroundColor: hasActiveFilters ? colors.primary : colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <Ionicons name="options" size={22} color={hasActiveFilters ? "#fff" : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/transaction/add")}
            className="rounded-full w-9 h-9 items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="mb-4">
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            onClear={handleClearSearch}
            placeholder="Search transactions..."
          />
        </View>
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
          <View className="gap-3">
            {filteredTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                className="p-4 rounded-xl"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: transaction.account.color + "20" }}
                  >
                    <Ionicons
                      name={transaction.account.icon as any}
                      size={24}
                      color={transaction.account.color}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-semibold" style={{ color: colors.text }}>
                        {transaction.account.name}
                      </Text>
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: getColorForType(transaction.type) + "20" }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: getColorForType(transaction.type) }}
                        >
                          {transaction.type}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                      {dayjs(transaction.transactedAt).format("DD MMM YYYY • HH:mm")}
                    </Text>
                    {transaction.note && (
                      <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                        {transaction.note}
                      </Text>
                    )}
                  </View>
                </View>
                <View className="flex-row items-center justify-between mt-3 pt-3" style={{ borderTopColor: colors.border, borderTopWidth: 1 }}>
                  <View className="flex-row items-center">
                    <Ionicons
                      name={getIconForType(transaction.type) as any}
                      size={16}
                      color={getColorForType(transaction.type)}
                      style={{ marginRight: 4 }}
                    />
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      {transaction.type === "DEPOSIT" ? "Deposit" : transaction.type === "WITHDRAWAL" ? "Withdrawal" : "Transfer"}
                    </Text>
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

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedAccount={searchFilters.accountId}
        onAccountChange={(accountId) => setSearchFilters({ accountId })}
        selectedType={searchFilters.type}
        onTypeChange={(type) => setSearchFilters({ type })}
        sortBy={sortBy}
        onSortChange={setSortBy}
        accounts={activeAccounts}
        onReset={handleResetFilters}
      />
    </SafeAreaView>
  );
}
