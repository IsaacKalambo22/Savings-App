import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter , useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useUIStore } from "@/store/ui.store";
import { ExportModal } from "@/components/export-modal";
import { ensureDefaultHousehold } from "@/features/accounts/services/account.service";
import { getHousehold, getSettings, updateSettings } from "@/features/household/services/household.service";
import { createBackup, shareBackup } from "@/features/export/services/backup.service";
import { enableDefaultReminders, disableAllReminders } from "@/features/notifications/services/notification.service";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
}: {
  icon: IoniconName;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-4 border-b border-gray-100 dark:border-[#2a2a2a]"
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950 items-center justify-center mr-3">
        <Ionicons name={icon} size={18} color="#0A63E0" />
      </View>
      <Text className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </Text>
      {value && (
        <Text className="text-sm text-gray-400 dark:text-gray-500 mr-2">
          {value}
        </Text>
      )}
      {rightElement}
      {!rightElement && onPress && (
        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme } = useUIStore();
  const [householdName, setHouseholdName] = useState("My Household");
  const [currencyLabel, setCurrencyLabel] = useState("MWK (MK)");
  const [showExport, setShowExport] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [householdId, setHouseholdId] = useState<string>("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const id = await ensureDefaultHousehold();
          setHouseholdId(id);
          const [household, settings] = await Promise.all([getHousehold(id), getSettings(id)]);
          if (household) setHouseholdName(household.name);
          if (settings) {
            setCurrencyLabel(`${settings.currency} (${settings.currencySymbol})`);
            setNotificationsEnabled(settings.notificationsEnabled);
          }
        } catch {
          // keep defaults
        }
      })();
    }, [])
  );

  const toggleNotifications = async (value: boolean) => {
    try {
      if (value) {
        const granted = await enableDefaultReminders();
        if (!granted) {
          Alert.alert("Permission needed", "Enable notifications for NestKeep in your device settings.");
          return;
        }
      } else {
        await disableAllReminders();
      }
      setNotificationsEnabled(value);
      if (householdId) await updateSettings(householdId, { notificationsEnabled: value });
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not update notifications");
    }
  };

  const themeLabel =
    theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light";

  const handleBackup = async () => {
    if (backingUp) return;
    try {
      setBackingUp(true);
      const result = await createBackup();
      if (result.success && result.filePath) {
        await shareBackup(result.filePath);
      } else {
        Alert.alert("Backup failed", result.error ?? "Unknown error");
      }
    } catch (err) {
      Alert.alert("Backup failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0a0a0a]">
      <View className="px-4 py-4">
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          Settings
        </Text>
      </View>

      <ScrollView className="flex-1 px-4">
        <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 mt-2">
          Appearance
        </Text>
        <View className="bg-gray-50 dark:bg-[#161616] rounded-xl px-4 mb-6">
          <SettingsRow
            icon="moon-outline"
            label="Theme"
            value={themeLabel}
            onPress={() => {
              const next =
                theme === "system" ? "light" : theme === "light" ? "dark" : "system";
              setTheme(next);
            }}
          />
        </View>

        <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
          Household
        </Text>
        <View className="bg-gray-50 dark:bg-[#161616] rounded-xl px-4 mb-6">
          <SettingsRow
            icon="home-outline"
            label="Household"
            value={householdName}
            onPress={() => router.push("/household")}
          />
          <SettingsRow
            icon="people-outline"
            label="Members"
            onPress={() => router.push("/household")}
          />
          <SettingsRow icon="cash-outline" label="Currency" value={currencyLabel} onPress={() => router.push("/household")} />
        </View>

        <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
          Goals
        </Text>
        <View className="bg-gray-50 dark:bg-[#161616] rounded-xl px-4 mb-6">
          <SettingsRow icon="flag-outline" label="Savings Goals" onPress={() => router.push("/goals")} />
        </View>

        <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
          Data
        </Text>
        <View className="bg-gray-50 dark:bg-[#161616] rounded-xl px-4 mb-6">
          <SettingsRow
            icon="cloud-upload-outline"
            label="Backup & Share"
            value={backingUp ? "Working…" : undefined}
            onPress={handleBackup}
          />
          <SettingsRow icon="download-outline" label="Export Data" onPress={() => setShowExport(true)} />
        </View>

        <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
          Notifications
        </Text>
        <View className="bg-gray-50 dark:bg-[#161616] rounded-xl px-4 mb-6">
          <SettingsRow
            icon="notifications-outline"
            label="Reminders"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ true: "#0A63E0" }}
              />
            }
          />
        </View>

        <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
          Security
        </Text>
        <View className="bg-gray-50 dark:bg-[#161616] rounded-xl px-4 mb-6">
          <SettingsRow
            icon="lock-closed-outline"
            label="PIN Lock"
            value="Coming soon"
            onPress={() => Alert.alert("Coming soon", "PIN lock arrives with the security update.")}
          />
          <SettingsRow
            icon="finger-print-outline"
            label="Biometrics"
            value="Coming soon"
            onPress={() => Alert.alert("Coming soon", "Biometric unlock arrives with the security update.")}
          />
        </View>

        <Text className="text-center text-xs text-gray-300 dark:text-gray-600 mt-4 mb-8">
          NestKeep v1.0.0
        </Text>
      </ScrollView>

      <ExportModal visible={showExport} onClose={() => setShowExport(false)} />
    </SafeAreaView>
  );
}
