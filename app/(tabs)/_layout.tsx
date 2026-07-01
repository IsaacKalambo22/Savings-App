import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "@/store/ui.store";
import { Colors } from "@/constants/colors";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  focused,
  color,
}: {
  name: IoniconName;
  focused: boolean;
  color: string;
}) {
  return <Ionicons name={focused ? name : (`${name}-outline` as IoniconName)} size={24} color={color} />;
}

export default function TabLayout() {
  const systemScheme = useColorScheme();
  const theme = useUIStore((s) => s.theme);
  const resolvedScheme = theme === "system" ? (systemScheme ?? "light") : theme;
  const colors = Colors[resolvedScheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.tabIconActive,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="wallet" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="swap-horizontal" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="bar-chart" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="settings" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
