import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/colors";

const ACCOUNT_COLORS = [
  "#0A63E0", "#479CFC", "#084FC0", "#22C55E", "#F59E0B",
  "#EF4444", "#7C3AED", "#EC4899", "#14B8A6", "#F97316",
  "#6366F1", "#8B5CF6", "#06B6D4", "#84CC16", "#F43F5E",
];

interface ColorPickerProps {
  visible: boolean;
  selectedColor: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}

export function ColorPicker({ visible, selectedColor, onSelect, onClose }: ColorPickerProps) {
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
            Select Color
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-base font-semibold" style={{ color: colors.primary }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          <View className="flex-row flex-wrap gap-3">
            {ACCOUNT_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => onSelect(color)}
                className="w-16 h-16 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: color,
                  borderWidth: 3,
                  borderColor: selectedColor === color ? colors.text : "transparent",
                }}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default ColorPicker;
