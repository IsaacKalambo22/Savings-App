import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import { queryClient } from "@/lib/query-client";
import { useUIStore } from "@/store/ui.store";
import { Colors } from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const theme = useUIStore((s) => s.theme);

  const resolvedScheme =
    theme === "system" ? (systemScheme ?? "light") : theme;
  const colors = Colors[resolvedScheme];

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding/index" options={{ animation: "fade" }} />
        <Stack.Screen name="account/[id]" options={{ headerShown: true, title: "" }} />
        <Stack.Screen name="transaction/add" options={{ presentation: "modal", headerShown: true, title: "Add Transaction" }} />
        <Stack.Screen name="transaction/edit" options={{ presentation: "modal", headerShown: true, title: "Edit Transaction" }} />
        <Stack.Screen name="transaction/transfer" options={{ presentation: "modal", headerShown: true, title: "Transfer" }} />
        <Stack.Screen name="modal/account-picker" options={{ presentation: "modal", headerShown: true, title: "Select Account" }} />
        <Stack.Screen name="modal/icon-picker" options={{ presentation: "modal", headerShown: true, title: "Select Icon" }} />
        <Stack.Screen name="modal/color-picker" options={{ presentation: "modal", headerShown: true, title: "Select Color" }} />
      </Stack>
    </QueryClientProvider>
  );
}
