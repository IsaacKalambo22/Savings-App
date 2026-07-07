import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert  } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter , useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { CURRENCIES } from "@/constants/currency";
import { MemberRole , HouseholdMember, AuditLog, Household } from "@/types/prisma";
import { ensureDefaultHousehold } from "@/features/accounts/services/account.service";
import { getHousehold, getSettings, updateHousehold } from "@/features/household/services/household.service";
import {
  getMembers,
  addMember,
  updateMemberRole,
  removeMember,
  ensureOwner,
  getActivityLog,
} from "@/features/household/services/member.service";
import dayjs from "dayjs";

const ROLES: MemberRole[] = [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER, MemberRole.VIEWER];
const ROLE_COLORS: Record<string, string> = {
  OWNER: "#0A63E0",
  ADMIN: "#7C3AED",
  MEMBER: "#22C55E",
  VIEWER: "#9ca3af",
};

export default function HouseholdScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [householdId, setHouseholdId] = useState<string>("");
  const [household, setHousehold] = useState<Household | null>(null);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("MWK");
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<MemberRole>(MemberRole.MEMBER);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const id = await ensureDefaultHousehold();
    setHouseholdId(id);
    await ensureOwner(id);
    const [hh, settings, mem, log] = await Promise.all([
      getHousehold(id),
      getSettings(id),
      getMembers(id),
      getActivityLog(id),
    ]);
    if (hh) {
      setHousehold(hh);
      setName(hh.name);
    }
    if (settings) setCurrency(settings.currency);
    setMembers(mem);
    setActivity(log);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const saveHousehold = async () => {
    if (!name.trim() || !householdId) return;
    await updateHousehold(householdId, { name: name.trim(), currency });
    Alert.alert("Saved", "Household details updated.");
    load();
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Enter a member name");
      return;
    }
    await addMember(householdId, { name: newName.trim(), role: newRole });
    setNewName("");
    setNewRole(MemberRole.MEMBER);
    setAdding(false);
    load();
  };

  const handleMemberActions = (member: HouseholdMember) => {
    const roleButtons = ROLES.filter((r) => r !== member.role).map((r) => ({
      text: `Make ${r.charAt(0) + r.slice(1).toLowerCase()}`,
      onPress: async () => {
        await updateMemberRole(householdId, member.id, r);
        load();
      },
    }));
    const buttons: any[] = [...roleButtons];
    if (member.role !== MemberRole.OWNER) {
      buttons.push({
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeMember(householdId, member.id);
            load();
          } catch (err) {
            Alert.alert("Error", err instanceof Error ? err.message : "Failed");
          }
        },
      });
    }
    buttons.push({ text: "Cancel", style: "cancel" });
    Alert.alert(member.name, `Role: ${member.role}`, buttons);
  };

  const describeActivity = (a: AuditLog): string => {
    const v = a.newValue ? JSON.parse(a.newValue) : null;
    const o = a.oldValue ? JSON.parse(a.oldValue) : null;
    switch (a.action) {
      case "added":
        return `Added ${v?.name ?? "member"} as ${v?.role ?? ""}`;
      case "role_changed":
        return `Changed a member's role to ${v?.role ?? ""}`;
      case "removed":
        return `Removed ${o?.name ?? "a member"}`;
      default:
        return `${a.action} ${a.entityType}`;
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center px-4 py-4 border-b" style={{ borderColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
          Household
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Household name */}
        <Text className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textSecondary }}>
          Details
        </Text>
        <View className="p-4 rounded-xl mb-3" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}>
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Household name"
            placeholderTextColor={colors.textTertiary}
            className="text-base"
            style={{ color: colors.text }}
          />
          <Text className="text-sm font-medium mb-2 mt-4" style={{ color: colors.textSecondary }}>Currency</Text>
          <View className="flex-row flex-wrap gap-2">
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                onPress={() => setCurrency(c.code)}
                className="px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: currency === c.code ? colors.primary + "20" : colors.background,
                  borderColor: currency === c.code ? colors.primary : colors.border,
                  borderWidth: 1,
                }}
              >
                <Text className="text-sm font-semibold" style={{ color: currency === c.code ? colors.primary : colors.text }}>
                  {c.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={saveHousehold} className="mt-4 p-3 rounded-lg items-center" style={{ backgroundColor: colors.primary }}>
            <Text className="text-sm font-bold text-white">Save Changes</Text>
          </TouchableOpacity>
        </View>

        {/* Members */}
        <View className="flex-row items-center justify-between mb-2 mt-4">
          <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
            Members
          </Text>
          <TouchableOpacity onPress={() => setAdding((v) => !v)}>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
              {adding ? "Cancel" : "+ Add"}
            </Text>
          </TouchableOpacity>
        </View>

        {adding && (
          <View className="p-4 rounded-xl mb-3" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Member name"
              placeholderTextColor={colors.textTertiary}
              className="p-3 rounded-lg mb-3"
              style={{ backgroundColor: colors.background, color: colors.text, borderColor: colors.border, borderWidth: 1 }}
            />
            <View className="flex-row flex-wrap gap-2 mb-3">
              {ROLES.filter((r) => r !== MemberRole.OWNER).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setNewRole(r)}
                  className="px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: newRole === r ? colors.primary + "20" : colors.background,
                    borderColor: newRole === r ? colors.primary : colors.border,
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: newRole === r ? colors.primary : colors.text }}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={handleAdd} className="p-3 rounded-lg items-center" style={{ backgroundColor: colors.primary }}>
              <Text className="text-sm font-bold text-white">Add Member</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="gap-2 mb-4">
          {members.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => handleMemberActions(m)}
              className="p-4 rounded-xl flex-row items-center"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: (ROLE_COLORS[m.role] ?? colors.primary) + "20" }}>
                <Ionicons name="person" size={20} color={ROLE_COLORS[m.role] ?? colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: colors.text }}>{m.name}</Text>
                {m.email && <Text className="text-xs" style={{ color: colors.textSecondary }}>{m.email}</Text>}
              </View>
              <View className="px-2 py-1 rounded-full" style={{ backgroundColor: (ROLE_COLORS[m.role] ?? colors.primary) + "20" }}>
                <Text className="text-xs font-semibold" style={{ color: ROLE_COLORS[m.role] ?? colors.primary }}>{m.role}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity log */}
        {activity.length > 0 && (
          <>
            <Text className="text-xs font-semibold uppercase tracking-wider mb-2 mt-2" style={{ color: colors.textSecondary }}>
              Activity
            </Text>
            <View className="gap-2 mb-8">
              {activity.map((a) => (
                <View key={a.id} className="p-3 rounded-xl flex-row items-center" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text className="text-sm flex-1" style={{ color: colors.text }}>{describeActivity(a)}</Text>
                  <Text className="text-xs" style={{ color: colors.textTertiary }}>{dayjs(a.createdAt).format("DD MMM")}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
