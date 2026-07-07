import { View, Text, TouchableOpacity , useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useSyncStore } from "@/features/sync/store/sync.store";
import { SyncStatus } from "@/types/sync";

export function SyncStatusIndicator() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const { status, pendingItems, isOnline, manualSync } = useSyncStore();

  const getStatusInfo = () => {
    switch (status) {
      case "syncing":
        return { icon: "sync", color: colors.primary, text: "Syncing..." };
      case "offline":
        return { icon: "cloud-offline", color: colors.textSecondary, text: "Offline" };
      case "error":
        return { icon: "alert-circle", color: colors.destructive, text: "Sync Error" };
      case "synced":
      default:
        if (pendingItems > 0) {
          return { icon: "time", color: colors.warning, text: `${pendingItems} pending` };
        }
        return { icon: "checkmark-circle", color: colors.success, text: "Synced" };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity
      onPress={() => {
        if (status !== "syncing" && isOnline && pendingItems > 0) {
          manualSync().catch(console.error);
        }
      }}
      className="flex-row items-center px-3 py-2 rounded-lg"
      style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
    >
      <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
      <Text className="text-xs ml-2" style={{ color: colors.textSecondary }}>
        {statusInfo.text}
      </Text>
    </TouchableOpacity>
  );
}
