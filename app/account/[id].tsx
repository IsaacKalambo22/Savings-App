import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/colors";
import { IconPicker } from "@/app/modal/account-picker";
import { ColorPicker } from "@/app/modal/color-picker";
import { ACCOUNT_ICONS, AccountIcon } from "@/types/account";
import { AccountStatus } from "@/types/prisma";

export default function AccountFormScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const isEditing = !!id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<AccountIcon>("wallet");
  const [selectedColor, setSelectedColor] = useState("#0A63E0");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Account name is required");
      return;
    }

    // TODO: Call service to create/update account
    console.log("Saving account:", { name, description, icon, color: selectedColor });
    
    Alert.alert("Success", isEditing ? "Account updated" : "Account created");
    router.push("/(tabs)/accounts");
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderColor: colors.border }}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/accounts")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text className="text-base font-semibold" style={{ color: colors.primary }}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: colors.text }}>
          {isEditing ? "Edit Account" : "New Account"}
        </Text>
        <TouchableOpacity onPress={handleSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text className="text-base font-semibold" style={{ color: colors.primary }}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Icon & Color Preview */}
        <View className="items-center py-6 mb-6">
          <View
            className="w-24 h-24 rounded-full items-center justify-center"
            style={{ backgroundColor: selectedColor + "20" }}
          >
            <Ionicons name={icon} size={48} color={selectedColor} />
          </View>
        </View>

        {/* Icon Selection */}
        <TouchableOpacity
          onPress={() => setShowIconPicker(true)}
          className="p-4 rounded-xl mb-3"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: selectedColor + "20" }}>
              <Ionicons name={icon} size={20} color={selectedColor} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Icon
              </Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                {icon}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Color Selection */}
        <TouchableOpacity
          onPress={() => setShowColorPicker(true)}
          className="p-4 rounded-xl mb-3"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-lg mr-3" style={{ backgroundColor: selectedColor }} />
            <View className="flex-1">
              <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Color
              </Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                {selectedColor}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Account Name */}
        <View className="mb-3">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Account Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Joint Account"
            placeholderTextColor={colors.textTertiary}
            className="p-4 rounded-xl"
            style={{ backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, borderWidth: 1 }}
          />
        </View>

        {/* Description */}
        <View className="mb-3">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Description (Optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add a description..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            className="p-4 rounded-xl"
            style={{ backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, borderWidth: 1, minHeight: 100 }}
          />
        </View>

        {/* Archive Option (only for editing) */}
        {isEditing && (
          <TouchableOpacity
            className="p-4 rounded-xl mt-4"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <View className="flex-row items-center">
              <Ionicons name="archive-outline" size={20} color={colors.destructive} />
              <Text className="ml-3 text-base font-semibold" style={{ color: colors.destructive }}>
                Archive Account
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      <IconPicker
        visible={showIconPicker}
        selectedIcon={icon}
        onSelect={(icon) => setIcon(icon as AccountIcon)}
        onClose={() => setShowIconPicker(false)}
      />

      <ColorPicker
        visible={showColorPicker}
        selectedColor={selectedColor}
        onSelect={setSelectedColor}
        onClose={() => setShowColorPicker(false)}
      />
    </View>
  );
}
