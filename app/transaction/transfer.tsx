import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/colors";
import { useAccountStore } from "@/features/accounts/store/account.store";
import { createTransfer } from "@/features/transactions/services/transaction.service";
import { reloadAccounts, reloadTransactions } from "@/lib/hydrate";

export default function TransferScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const { activeAccounts } = useAccountStore();

  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [transactedAt] = useState(new Date());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!fromAccountId) {
      Alert.alert("Error", "Please select source account");
      return;
    }
    if (!toAccountId) {
      Alert.alert("Error", "Please select destination account");
      return;
    }
    if (fromAccountId === toAccountId) {
      Alert.alert("Error", "Source and destination accounts must be different");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    if (saving) return;

    try {
      setSaving(true);
      await createTransfer({
        fromAccountId,
        toAccountId,
        amount: parseFloat(amount),
        note: note.trim() || undefined,
        transactedAt,
      });
      await Promise.all([reloadAccounts(), reloadTransactions()]);
      router.back();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to record transfer");
    } finally {
      setSaving(false);
    }
  };

  const swapAccounts = () => {
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-base font-semibold" style={{ color: colors.primary }}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: colors.text }}>
          Transfer
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text className="text-base font-semibold" style={{ color: colors.primary }}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* From Account */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            From Account
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {activeAccounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                onPress={() => setFromAccountId(account.id)}
                className="p-3 rounded-xl min-w-[120px]"
                style={{
                  backgroundColor: fromAccountId === account.id ? colors.primary + "20" : colors.surface,
                  borderColor: fromAccountId === account.id ? colors.primary : colors.border,
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

        {/* Swap Button */}
        <View className="items-center my-2">
          <TouchableOpacity
            onPress={swapAccounts}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <Ionicons name="swap-vertical" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* To Account */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            To Account
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {activeAccounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                onPress={() => setToAccountId(account.id)}
                className="p-3 rounded-xl min-w-[120px]"
                style={{
                  backgroundColor: toAccountId === account.id ? colors.primary + "20" : colors.surface,
                  borderColor: toAccountId === account.id ? colors.primary : colors.border,
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

        {/* Date */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Date
          </Text>
          <TouchableOpacity
            className="p-4 rounded-xl"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-base" style={{ color: colors.text }}>
              {transactedAt.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View
          className="p-4 rounded-xl mt-4"
          style={{ backgroundColor: colors.primary + "10", borderColor: colors.primary, borderWidth: 1 }}
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              Transfer Amount
            </Text>
            <Text className="text-xl font-bold" style={{ color: colors.primary }}>
              MK {amount || "0.00"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
