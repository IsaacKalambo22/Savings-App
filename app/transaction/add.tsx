import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert  } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { DateTimeField } from "@/components/datetime-field";
import { useAccountStore } from "@/features/accounts/store/account.store";
import { TransactionType } from "@/types/prisma";
import { createTransaction } from "@/features/transactions/services/transaction.service";
import { reloadAccounts, reloadTransactions } from "@/lib/hydrate";

export default function AddTransactionScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { activeAccounts } = useAccountStore();

  const transactionType = type === "withdrawal" ? TransactionType.WITHDRAWAL : TransactionType.DEPOSIT;
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [transactedAt, setTransactedAt] = useState(new Date());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedAccountId) {
      Alert.alert("Error", "Please select an account");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    if (saving) return;

    try {
      setSaving(true);
      await createTransaction({
        accountId: selectedAccountId,
        type: transactionType,
        amount: parseFloat(amount),
        note: note.trim() || undefined,
        transactedAt,
      });
      await Promise.all([reloadAccounts(), reloadTransactions()]);
      router.back();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-base font-semibold" style={{ color: colors.primary }}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: colors.text }}>
          {transactionType === TransactionType.DEPOSIT ? "Deposit" : "Withdrawal"}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text className="text-base font-semibold" style={{ color: colors.primary }}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Account Selection */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Account
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {activeAccounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                onPress={() => setSelectedAccountId(account.id)}
                className="p-3 rounded-xl min-w-[120px]"
                style={{
                  backgroundColor: selectedAccountId === account.id ? colors.primary + "20" : colors.surface,
                  borderColor: selectedAccountId === account.id ? colors.primary : colors.border,
                  borderWidth: 2,
                }}
              >
                <View className="items-center">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: account.color + "20" }}
                  >
                    <Ionicons name={account.icon as any} size={20} color={account.color} />
                  </View>
                  <Text className="text-xs font-semibold text-center" style={{ color: colors.text }}>
                    {account.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Amount Input */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Amount (MWK)
          </Text>
          <View
            className="p-4 rounded-xl flex-row items-center"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-2xl font-bold mr-2" style={{ color: colors.text }}>
              MK
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              className="flex-1 text-2xl font-bold"
              style={{ color: colors.text }}
            />
          </View>
        </View>

        {/* Note */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Note (Optional)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            className="p-4 rounded-xl"
            style={{ backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, borderWidth: 1, minHeight: 100 }}
          />
        </View>

        {/* Date & Time */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Date & Time
          </Text>
          <DateTimeField value={transactedAt} onChange={setTransactedAt} maximumDate={new Date()} />
        </View>

        {/* Summary */}
        <View
          className="p-4 rounded-xl mt-4"
          style={{ backgroundColor: colors.primary + "10", borderColor: colors.primary, borderWidth: 1 }}
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              {transactionType === TransactionType.DEPOSIT ? "Total Deposit" : "Total Withdrawal"}
            </Text>
            <Text className="text-xl font-bold" style={{ color: colors.primary }}>
              MK {amount || "0.00"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
