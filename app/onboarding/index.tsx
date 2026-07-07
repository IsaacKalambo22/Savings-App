import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/colors";
import { CURRENCIES } from "@/constants/currency";
import { ensureDefaultHousehold } from "@/features/accounts/services/account.service";
import { updateHousehold } from "@/features/household/services/household.service";
import { useAppStore } from "@/store/app.store";

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);
  const setHouseholdId = useAppStore((s) => s.setHouseholdId);

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("MWK");
  const [saving, setSaving] = useState(false);

  const currencyOptions = CURRENCIES ?? [{ code: "MWK", symbol: "MK", name: "Malawian Kwacha" }];

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert("Almost there", "Please give your household a name.");
      return;
    }
    if (saving) return;
    try {
      setSaving(true);
      const householdId = await ensureDefaultHousehold();
      await updateHousehold(householdId, { name: name.trim(), currency });
      setHouseholdId(householdId);
      setOnboardingDone(true);
      router.replace("/(tabs)");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 px-6 justify-center">
        <View
          className="w-16 h-16 rounded-2xl items-center justify-center mb-6"
          style={{ backgroundColor: colors.primary }}
        >
          <Ionicons name="home" size={32} color="#fff" />
        </View>

        <Text className="text-3xl font-bold" style={{ color: colors.text }}>
          Welcome to NestKeep
        </Text>
        <Text className="text-base mt-2 mb-8" style={{ color: colors.textSecondary }}>
          Organise every savings account in one place. Let's set up your household.
        </Text>

        {/* Household name */}
        <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
          Household Name
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g., The Bandas"
          placeholderTextColor={colors.textTertiary}
          className="p-4 rounded-xl mb-6"
          style={{ backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, borderWidth: 1 }}
        />

        {/* Currency */}
        <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
          Currency
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-10">
          {currencyOptions.map((c: any) => (
            <TouchableOpacity
              key={c.code}
              onPress={() => setCurrency(c.code)}
              className="px-4 py-3 rounded-xl"
              style={{
                backgroundColor: currency === c.code ? colors.primary + "20" : colors.surface,
                borderColor: currency === c.code ? colors.primary : colors.border,
                borderWidth: 2,
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: currency === c.code ? colors.primary : colors.text }}
              >
                {c.code} · {c.symbol}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={saving}
          className="p-4 rounded-xl items-center"
          style={{ backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }}
        >
          <Text className="text-base font-bold text-white">
            {saving ? "Setting up…" : "Get Started"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
