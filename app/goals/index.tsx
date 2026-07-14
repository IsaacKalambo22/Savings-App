import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert  } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useAccountStore } from "@/features/accounts/store/account.store";
import { ensureDefaultHousehold } from "@/features/accounts/services/account.service";
import { fromBigInt } from "@/features/transactions/services/transaction.service";
import {
  GoalWithProgress,
  createGoal,
  setGoalCompleted,
  deleteGoal,
} from "@/features/goals/services/goal.service";
import { useGoalStore } from "@/features/goals/store/goal.store";
import { reloadGoals } from "@/lib/hydrate";
import dayjs from "dayjs";

export default function GoalsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { activeAccounts } = useAccountStore();

  const { goals } = useGoalStore();
  const [householdId, setHouseholdId] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const id = await ensureDefaultHousehold();
    setHouseholdId(id);
    await reloadGoals(id);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Enter a goal name");
      return;
    }
    if (!target || parseFloat(target) <= 0) {
      Alert.alert("Error", "Enter a valid target amount");
      return;
    }
    await createGoal(householdId, {
      name: name.trim(),
      targetAmount: parseFloat(target),
      accountId,
    });
    setName("");
    setTarget("");
    setAccountId(null);
    setAdding(false);
    load();
  };

  const handleGoalPress = (goal: GoalWithProgress) => {
    Alert.alert(goal.name, undefined, [
      {
        text: goal.isCompleted ? "Mark as in progress" : "Mark as complete",
        onPress: async () => {
          await setGoalCompleted(goal.id, !goal.isCompleted);
          load();
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteGoal(goal.id);
          load();
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderColor: colors.border }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
            Savings Goals
          </Text>
        </View>
        <TouchableOpacity onPress={() => setAdding((v) => !v)}>
          <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
            {adding ? "Cancel" : "+ New"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {adding && (
          <View className="p-4 rounded-xl mb-4" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}>
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Goal Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Emergency Fund"
              placeholderTextColor={colors.textTertiary}
              className="p-3 rounded-lg mb-3"
              style={{ backgroundColor: colors.background, color: colors.text, borderColor: colors.border, borderWidth: 1 }}
            />
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Target (MWK)</Text>
            <TextInput
              value={target}
              onChangeText={setTarget}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              className="p-3 rounded-lg mb-3"
              style={{ backgroundColor: colors.background, color: colors.text, borderColor: colors.border, borderWidth: 1 }}
            />
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Track with account (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-3">
              {activeAccounts.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => setAccountId(accountId === a.id ? null : a.id)}
                  className="px-3 py-2 rounded-lg mr-2"
                  style={{
                    backgroundColor: accountId === a.id ? colors.primary + "20" : colors.background,
                    borderColor: accountId === a.id ? colors.primary : colors.border,
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: accountId === a.id ? colors.primary : colors.text }}>
                    {a.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={handleAdd} className="p-3 rounded-lg items-center" style={{ backgroundColor: colors.primary }}>
              <Text className="text-sm font-bold text-white">Create Goal</Text>
            </TouchableOpacity>
          </View>
        )}

        {goals.length === 0 && !adding ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="flag-outline" size={48} color={colors.textSecondary} />
            <Text className="text-base font-semibold mt-3" style={{ color: colors.textSecondary }}>
              No goals yet
            </Text>
            <Text className="text-sm mt-1 text-center" style={{ color: colors.textTertiary }}>
              Set a savings target and track your progress.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {goals.map((goal) => {
              const pct = Math.round(goal.progress * 100);
              return (
                <TouchableOpacity
                  key={goal.id}
                  onPress={() => handleGoalPress(goal)}
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      <Ionicons
                        name={goal.isCompleted ? "checkmark-circle" : "flag"}
                        size={20}
                        color={goal.isCompleted ? colors.success : colors.primary}
                        style={{ marginRight: 8 }}
                      />
                      <Text className="text-base font-bold flex-1" style={{ color: colors.text }} numberOfLines={1}>
                        {goal.name}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold" style={{ color: goal.isCompleted ? colors.success : colors.primary }}>
                      {pct}%
                    </Text>
                  </View>

                  {/* Progress bar */}
                  <View className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: colors.border }}>
                    <View
                      className="h-2 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: goal.isCompleted ? colors.success : colors.primary }}
                    />
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      MK {fromBigInt(goal.currentAmount).toLocaleString()} of MK {fromBigInt(goal.targetAmount).toLocaleString()}
                    </Text>
                    {goal.deadline && (
                      <Text className="text-xs" style={{ color: colors.textTertiary }}>
                        by {dayjs(goal.deadline).format("DD MMM YYYY")}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
