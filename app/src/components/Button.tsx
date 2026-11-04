import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { useTheme } from "@/theme/ThemeProvider";

import { AppText } from "./AppText";

interface Props {
  label: string;
  onPress: () => void;
  kind?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
  subtitle?: string;
  disabled?: boolean;
  accessibilityHint?: string;
}

export function Button({ label, onPress, kind = "primary", icon, subtitle, disabled, accessibilityHint }: Props) {
  const { palette } = useTheme();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bg = kind === "primary" ? palette.accent : kind === "secondary" ? palette.surface : "transparent";
  const fg = kind === "primary" ? palette.onAccent : palette.text;

  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${label}. ${subtitle}` : label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPressIn={() => (scale.value = withSpring(0.96, { damping: 15, stiffness: 400 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 8, stiffness: 260 }))}
        onPress={onPress}
        style={[
          styles.button,
          { backgroundColor: bg, opacity: disabled ? 0.5 : 1 },
          kind === "secondary" && { borderWidth: 2, borderColor: palette.border },
        ]}
      >
        {icon ? <View>{icon}</View> : null}
        <View style={styles.labels}>
          <AppText weight="heavy" variant="large" color={fg} align={subtitle || icon ? "left" : "center"}>
            {label}
          </AppText>
          {subtitle ? (
            <AppText variant="small" color={fg} style={{ opacity: 0.8 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 60,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  labels: { flex: 1 },
});
