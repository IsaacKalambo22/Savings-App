import "../global.css";

import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import { queryClient } from "@/lib/query-client";
import { useUIStore } from "@/store/ui.store";
import { useAppStore } from "@/store/app.store";
import { Colors } from "@/constants/colors";
import { initializeApp } from "@/lib/hydrate";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const theme = useUIStore((s) => s.theme);
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const resolvedScheme: "light" | "dark" =
    (theme === "system" ? systemScheme : theme) === "dark" ? "dark" : "light";
  const colors = Colors[resolvedScheme];

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initializeApp();
      } catch (err) {
        console.error("App initialization failed:", err);
      }
      // Wait for the persisted app store (onboarding flag) to hydrate so we
      // don't flash the onboarding screen for returning users.
      if (!useAppStore.persist.hasHydrated()) {
        await new Promise<void>((resolve) => {
          const unsub = useAppStore.persist.onFinishHydration(() => {
            unsub();
            resolve();
          });
        });
      }
      if (mounted) setReady(true);
      await SplashScreen.hideAsync();
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // First-run: send users to onboarding once everything is hydrated.
  useEffect(() => {
    if (ready && !useAppStore.getState().onboardingDone) {
      router.replace("/onboarding");
    }
  }, [ready, router]);

  if (!ready) {
    return null;
  }

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
        <Stack.Screen name="account/new" />
        <Stack.Screen name="account/[id]/index" />
        <Stack.Screen name="account/[id]/edit" />
        <Stack.Screen name="transaction/add" options={{ presentation: "modal" }} />
        <Stack.Screen name="transaction/edit" options={{ presentation: "modal" }} />
        <Stack.Screen name="transaction/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="transaction/transfer" options={{ presentation: "modal" }} />
        <Stack.Screen name="modal/color-picker" options={{ presentation: "modal" }} />
      </Stack>
    </QueryClientProvider>
  );
}
