import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAccountStore } from "@/features/accounts/store/account.store";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/colors";

export default function AccountsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const { activeAccounts } = useAccountStore();

  const formatBalance = (balance: bigint) => {
    const value = Number(balance) / 100;
    return `MK ${value.toLocaleString()}`;
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between px-4 py-4">
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Accounts
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/account/new")}
          className="rounded-full w-9 h-9 items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        {activeAccounts.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="wallet-outline" size={48} color={colors.textSecondary} />
            <Text className="text-base font-semibold mt-3" style={{ color: colors.textSecondary }}>
              No accounts yet
            </Text>
            <Text className="text-sm mt-1 text-center" style={{ color: colors.textTertiary }}>
              Create your first savings account to get started.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {activeAccounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                className="p-4 rounded-xl"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: account.color + "20" }}
                  >
                    <Ionicons name={account.icon as any} size={24} color={account.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold" style={{ color: colors.text }}>
                      {account.name}
                    </Text>
                    <Text className="text-sm" style={{ color: colors.textSecondary }}>
                      {account.transactionCount} transactions
                    </Text>
                  </View>
                  <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                    {formatBalance(account.balance)}
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
