import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "@/store/ui.store";

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
  const { theme, setTheme } = useUIStore();

  const themeLabel =
    theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light";

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
          <SettingsRow icon="home-outline" label="Household Name" value="My Household" onPress={() => {}} />
          <SettingsRow icon="cash-outline" label="Currency" value="MWK (MK)" onPress={() => {}} />
        </View>

        <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
          Security
        </Text>
        <View className="bg-gray-50 dark:bg-[#161616] rounded-xl px-4 mb-6">
          <SettingsRow icon="lock-closed-outline" label="PIN Lock" onPress={() => {}} />
          <SettingsRow icon="finger-print-outline" label="Biometrics" onPress={() => {}} />
        </View>

        <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
          Data
        </Text>
        <View className="bg-gray-50 dark:bg-[#161616] rounded-xl px-4 mb-6">
          <SettingsRow icon="cloud-upload-outline" label="Backup" onPress={() => {}} />
          <SettingsRow icon="download-outline" label="Export Data" onPress={() => {}} />
        </View>

        <Text className="text-center text-xs text-gray-300 dark:text-gray-600 mt-4 mb-8">
          NestKeep v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
