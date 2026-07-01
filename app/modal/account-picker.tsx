import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/colors";
import { ACCOUNT_ICONS } from "@/types/account";

interface IconPickerProps {
  visible: boolean;
  selectedIcon: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

export function IconPicker({ visible, selectedIcon, onSelect, onClose }: IconPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderColor: colors.border }}>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-base font-semibold" style={{ color: colors.primary }}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            Select Icon
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-base font-semibold" style={{ color: colors.primary }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          <View className="flex-row flex-wrap gap-3">
            {ACCOUNT_ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                onPress={() => onSelect(icon)}
                className="w-16 h-16 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: selectedIcon === icon ? colors.primary + "20" : colors.surface,
                  borderColor: selectedIcon === icon ? colors.primary : colors.border,
                  borderWidth: 2,
                }}
              >
                <Ionicons
                  name={icon as any}
                  size={28}
                  color={selectedIcon === icon ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default IconPicker;
