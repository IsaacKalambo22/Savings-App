import { View, Text, TextInput, TouchableOpacity, Alert  } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { CURRENCIES } from "@/constants/currency";
import { ensureDefaultHousehold } from "@/features/accounts/services/account.service";
import { updateHousehold, joinHouseholdByCode } from "@/features/household/services/household.service";
import { useAppStore } from "@/store/app.store";

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);
  const setHouseholdId = useAppStore((s) => s.setHouseholdId);

  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("MWK");
  const [code, setCode] = useState("");
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

  const handleJoin = async () => {
    if (saving) return;
    if (!code.trim()) {
      Alert.alert("Enter a code", "Type the household code someone shared with you.");
      return;
    }
    try {
      setSaving(true);
      await joinHouseholdByCode(code);
      setOnboardingDone(true);
      router.replace("/(tabs)");
    } catch (err) {
      Alert.alert("Couldn't join", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // Let users enter the app without finishing setup — a default household is
  // created automatically and can be renamed later in Settings → Household.
  const handleSkip = async () => {
    if (saving) return;
    try {
      const householdId = await ensureDefaultHousehold();
      setHouseholdId(householdId);
    } catch {
      /* default household is created lazily elsewhere if this fails */
    }
    setOnboardingDone(true);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row justify-end px-6 pt-2">
        <TouchableOpacity
          onPress={handleSkip}
          disabled={saving}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-base font-semibold" style={{ color: colors.textSecondary }}>
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>

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
        <Text className="text-base mt-2 mb-6" style={{ color: colors.textSecondary }}>
          Organise every savings account in one place.
        </Text>

        {/* Create / Join toggle */}
        <View
          className="flex-row rounded-xl mb-6 p-1"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          {(["create", "join"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              className="flex-1 py-2.5 rounded-lg items-center"
              style={{ backgroundColor: mode === m ? colors.primary : "transparent" }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: mode === m ? "#fff" : colors.textSecondary }}
              >
                {m === "create" ? "Create new" : "Join with code"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === "create" ? (
          <>
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
          </>
        ) : (
          <>
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Household Code
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="e.g., BND-47Q"
              autoCapitalize="characters"
              autoCorrect={false}
              placeholderTextColor={colors.textTertiary}
              className="p-4 rounded-xl mb-3"
              style={{ backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, borderWidth: 1, letterSpacing: 2 }}
            />
            <Text className="text-xs mb-10" style={{ color: colors.textTertiary }}>
              Ask a household member for their code — they can find it under Settings → Household.
            </Text>

            <TouchableOpacity
              onPress={handleJoin}
              disabled={saving}
              className="p-4 rounded-xl items-center"
              style={{ backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }}
            >
              <Text className="text-base font-bold text-white">
                {saving ? "Joining…" : "Join household"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
