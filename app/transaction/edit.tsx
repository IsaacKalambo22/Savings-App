import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator , useColorScheme } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Colors } from "@/constants/colors";
import { TransactionType } from "@/types/prisma";
import { TransactionWithAccount } from "@/types/transaction";
import {
  fromBigInt,
  getTransaction,
  updateTransaction,
} from "@/features/transactions/services/transaction.service";
import { reloadAccounts, reloadTransactions } from "@/lib/hydrate";

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const [transaction, setTransaction] = useState<TransactionWithAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tx = await getTransaction(id);
        if (mounted && tx) {
          setTransaction(tx);
          setAmount(String(fromBigInt(tx.amount)));
          setNote(tx.note ?? "");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    if (saving) return;
    try {
      setSaving(true);
      await updateTransaction(id, {
        amount: parseFloat(amount),
        note: note.trim() || undefined,
      });
      await Promise.all([reloadAccounts(), reloadTransactions()]);
      router.back();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to update transaction");
    } finally {
      setSaving(false);
    }
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
        <Text className="text-base font-semibold" style={{ color: colors.text }}>
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

  const isDeposit = transaction.type === TransactionType.DEPOSIT;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-base font-semibold" style={{ color: colors.primary }}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: colors.text }}>
          Edit Transaction
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text className="text-base font-semibold" style={{ color: colors.primary, opacity: saving ? 0.6 : 1 }}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Account (read-only — move money via a transfer or reversal, not by re-pointing) */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Account
          </Text>
          <View
            className="p-4 rounded-xl"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              {transaction.account.name} · {isDeposit ? "Deposit" : "Withdrawal"}
            </Text>
          </View>
        </View>

        {/* Amount */}
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

        <Text className="text-xs mt-2" style={{ color: colors.textTertiary }}>
          Tip: to correct an already-synced transaction, reverse it from the details screen instead of editing.
        </Text>
      </ScrollView>
    </View>
  );
}
