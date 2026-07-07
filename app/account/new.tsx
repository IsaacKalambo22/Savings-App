import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput  } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useAccountStore } from "@/features/accounts/store/account.store";
import { createAccount as createAccountService, ensureDefaultHousehold } from "@/features/accounts/services/account.service";
import { ACCOUNT_ICONS, AccountIcon } from "@/types/account";
import { AccountStatus } from "@/types/prisma";
import { useState } from "react";

export default function NewAccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { addAccount } = useAccountStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<AccountIcon>(ACCOUNT_ICONS[0]);
  const [color, setColor] = useState("#0A63E0");

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter an account name");
      return;
    }

    try {
      // Ensure default household exists
      const householdId = await ensureDefaultHousehold();
      
      const account = await createAccountService(householdId, {
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        status: AccountStatus.ACTIVE,
      });
      
      // Add to store
      addAccount({
        ...account,
        balance: BigInt(0),
        transactionCount: 0,
      });
      
      router.push("/(tabs)/accounts");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create account");
    }
  };

  const ACCOUNT_COLORS = [
    "#0A63E0", // Blue
    "#22C55E", // Green
    "#EF4444", // Red
    "#F59E0B", // Orange
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#64748B", // Gray
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderColor: colors.border }}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/accounts")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: colors.text }}>
          New Account
        </Text>
        <TouchableOpacity onPress={handleSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text className="text-base font-semibold" style={{ color: colors.primary }}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Account Name */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
            Account Name
          </Text>
          <TextInput
            className="p-4 rounded-xl text-base"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, color: colors.text }}
            placeholder="e.g., Savings, Wallet"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
            Description (Optional)
          </Text>
          <TextInput
            className="p-4 rounded-xl text-base"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, color: colors.text }}
            placeholder="What is this account for?"
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Icon Selection */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
            Icon
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {ACCOUNT_ICONS.map((accountIcon) => (
              <TouchableOpacity
                key={accountIcon}
                onPress={() => setIcon(accountIcon)}
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: icon === accountIcon ? colors.primary + "20" : colors.surface,
                  borderColor: icon === accountIcon ? colors.primary : colors.border,
                  borderWidth: 1,
                }}
              >
                <Ionicons name={accountIcon as any} size={24} color={icon === accountIcon ? colors.primary : colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Selection */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
            Color
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {ACCOUNT_COLORS.map((accountColor) => (
              <TouchableOpacity
                key={accountColor}
                onPress={() => setColor(accountColor)}
                className="w-10 h-10 rounded-full"
                style={{
                  backgroundColor: accountColor,
                  borderWidth: color === accountColor ? 3 : 0,
                  borderColor: colors.text,
                }}
              />
            ))}
          </View>
        </View>

        {/* Preview */}
        <View className="mt-6 p-4 rounded-xl" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}>
          <Text className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>
            Preview
          </Text>
          <View className="flex-row items-center">
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
              style={{ backgroundColor: color + "20" }}
            >
              <Ionicons name={icon as any} size={28} color={color} />
            </View>
            <View>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {name || "Account Name"}
              </Text>
              {description && (
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  {description}
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
