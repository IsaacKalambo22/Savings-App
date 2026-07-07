import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useUIStore } from "@/store/ui.store";
import { useTheme } from "@/hooks/useTheme";
import { ExportModal } from "@/components/export-modal";
import { ensureDefaultHousehold } from "@/features/accounts/services/account.service";
import { getHousehold, getSettings, updateSettings } from "@/features/household/services/household.service";
import { createBackup, shareBackup } from "@/features/export/services/backup.service";
import { enableDefaultReminders, disableAllReminders } from "@/features/notifications/services/notification.service";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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

  const themeLabel = theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light";

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

  const toggleNotifications = async (value: boolean) => {
    try {
      if (value) {
        const granted = await enableDefaultReminders();
        if (!granted) {
          Alert.alert("Permission needed", "Enable notifications for NestKeep in your device settings (a development build is required for notifications).");
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

  const SectionLabel = ({ children }: { children: string }) => (
    <Text
      className="text-xs font-semibold uppercase tracking-wider mb-2"
      style={{ color: colors.textSecondary }}
    >
      {children}
    </Text>
  );

  const Row = ({
    icon,
    label,
    value,
    onPress,
    rightElement,
    last,
  }: {
    icon: IoniconName;
    label: string;
    value?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    last?: boolean;
  }) => (
    <TouchableOpacity
      className="flex-row items-center py-4"
      style={last ? undefined : { borderBottomWidth: 1, borderBottomColor: colors.border }}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
        style={{ backgroundColor: colors.primary + "20" }}
      >
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text className="flex-1 text-sm font-medium" style={{ color: colors.text }}>
        {label}
      </Text>
      {value && (
        <Text className="text-sm mr-2" style={{ color: colors.textSecondary }}>
          {value}
        </Text>
      )}
      {rightElement}
      {!rightElement && onPress && (
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  const Card = ({ children }: { children: React.ReactNode }) => (
    <View
      className="rounded-xl px-4 mb-6"
      style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="px-4 py-4">
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Settings
        </Text>
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="mt-2">
          <SectionLabel>Appearance</SectionLabel>
        </View>
        <Card>
          <Row
            icon="moon-outline"
            label="Theme"
            value={themeLabel}
            last
            onPress={() => {
              const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
              setTheme(next);
            }}
          />
        </Card>

        <SectionLabel>Household</SectionLabel>
        <Card>
          <Row icon="home-outline" label="Household" value={householdName} onPress={() => router.push("/household")} />
          <Row icon="people-outline" label="Members" onPress={() => router.push("/household")} />
          <Row icon="cash-outline" label="Currency" value={currencyLabel} last onPress={() => router.push("/household")} />
        </Card>

        <SectionLabel>Goals</SectionLabel>
        <Card>
          <Row icon="flag-outline" label="Savings Goals" last onPress={() => router.push("/goals")} />
        </Card>

        <SectionLabel>Data</SectionLabel>
        <Card>
          <Row
            icon="cloud-upload-outline"
            label="Backup & Share"
            value={backingUp ? "Working…" : undefined}
            onPress={handleBackup}
          />
          <Row icon="download-outline" label="Export Data" last onPress={() => setShowExport(true)} />
        </Card>

        <SectionLabel>Notifications</SectionLabel>
        <Card>
          <Row
            icon="notifications-outline"
            label="Reminders"
            last
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ true: colors.primary }}
              />
            }
          />
        </Card>

        <SectionLabel>Security</SectionLabel>
        <Card>
          <Row
            icon="lock-closed-outline"
            label="PIN Lock"
            value="Coming soon"
            onPress={() => Alert.alert("Coming soon", "PIN lock arrives with the security update.")}
          />
          <Row
            icon="finger-print-outline"
            label="Biometrics"
            value="Coming soon"
            last
            onPress={() => Alert.alert("Coming soon", "Biometric unlock arrives with the security update.")}
          />
        </Card>

        <Text className="text-center text-xs mt-4 mb-8" style={{ color: colors.textTertiary }}>
          NestKeep v1.0.0
        </Text>
      </ScrollView>

      <ExportModal visible={showExport} onClose={() => setShowExport(false)} />
    </SafeAreaView>
  );
}
