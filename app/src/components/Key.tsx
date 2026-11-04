import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated";

import { useTheme } from "@/theme/ThemeProvider";

interface Props {
  onPress: () => void;
  background: string;
  height: number;
  flex?: number;
  disabled?: boolean;
  glow?: boolean;
  accessibilityLabel: string;
  children: ReactNode;
}

/** A big, bouncy key. Springs down on touch and back on release. */
export function Key({ onPress, background, height, flex = 1, disabled, glow, accessibilityLabel, children }: Props) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[{ flex }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPressIn={() => {
          if (!reduceMotion) scale.value = withSpring(0.88, { damping: 14, stiffness: 520 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 7, stiffness: 300 });
        }}
        onPress={onPress}
        style={[
          styles.key,
          { height, backgroundColor: background, opacity: disabled ? 0.35 : 1 },
          glow && { borderWidth: 3, borderColor: palette.accent },
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  key: { borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
