import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ThemeProvider";

import { AppText } from "./AppText";

export function Screen({ children }: { children: ReactNode }) {
  const { palette } = useTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

export function Header({ left, title, right }: { left?: ReactNode; title?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>{left}</View>
      <AppText variant="large" weight="heavy" align="center" numberOfLines={1} style={styles.title} accessibilityRole="header">
        {title}
      </AppText>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner: { flex: 1, width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: 12 },
  header: { height: 60, flexDirection: "row", alignItems: "center" },
  side: { flexDirection: "row", minWidth: 96, gap: 2 },
  right: { justifyContent: "flex-end" },
  title: { flex: 1 },
});
