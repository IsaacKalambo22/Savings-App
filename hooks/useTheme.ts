import { useColorScheme } from "react-native";
import { useUIStore } from "@/store/ui.store";
import { Colors } from "@/constants/colors";

/** Resolves the effective color scheme (respecting the user's theme preference) and its palette. */
export function useTheme() {
  const systemScheme = useColorScheme();
  const theme = useUIStore((s) => s.theme);
  const scheme: "light" | "dark" =
    (theme === "system" ? systemScheme : theme) === "dark" ? "dark" : "light";
  return { scheme, colors: Colors[scheme], preference: theme };
}
