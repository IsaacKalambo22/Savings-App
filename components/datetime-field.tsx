// Cross-platform date + time picker field.
// Android uses the native dialog (auto-dismisses); iOS shows a spinner inside a
// bottom sheet with a Done button. Backed by @react-native-community/datetimepicker
// (bundled with Expo Go).

import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import dayjs from "dayjs";

export function DateTimeField({
  value,
  onChange,
  maximumDate,
}: {
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
}) {
  const { colors } = useTheme();
  const [mode, setMode] = useState<null | "date" | "time">(null);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Android returns via the dialog and should close immediately.
    if (Platform.OS !== "ios") setMode(null);
    if (event.type === "dismissed" || !selected) return;
    onChange(selected);
  };

  const fieldStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  };

  return (
    <View className="flex-row gap-2">
      <TouchableOpacity onPress={() => setMode("date")} className="flex-1 p-4 rounded-xl flex-row items-center" style={fieldStyle}>
        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <Text className="text-base" style={{ color: colors.text }}>
          {dayjs(value).format("DD MMM YYYY")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode("time")} className="p-4 rounded-xl flex-row items-center" style={fieldStyle}>
        <Ionicons name="time-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <Text className="text-base" style={{ color: colors.text }}>
          {dayjs(value).format("HH:mm")}
        </Text>
      </TouchableOpacity>

      {mode && Platform.OS === "ios" && (
        <Modal transparent animationType="fade" visible>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setMode(null)}
            className="flex-1 justify-end"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          >
            <View style={{ backgroundColor: colors.surface }}>
              <View className="flex-row justify-end px-4 py-3 border-b" style={{ borderColor: colors.border }}>
                <TouchableOpacity onPress={() => setMode(null)}>
                  <Text className="text-base font-semibold" style={{ color: colors.primary }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={value}
                mode={mode}
                display="spinner"
                maximumDate={maximumDate}
                onChange={(_e, d) => d && onChange(d)}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {mode && Platform.OS !== "ios" && (
        <DateTimePicker
          value={value}
          mode={mode}
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      )}
    </View>
  );
}
