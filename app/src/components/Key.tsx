import { useRef, type ReactNode } from "react";
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
  /** Act the moment a finger lands, so fast typing never drops a key. */
  onTouchDown?: boolean;
  onLongPress?: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  children: ReactNode;
}

/** A big, bouncy key. Springs down on touch and back on release. */
export function Key({
  onPress,
  background,
  height,
  flex = 1,
  disabled,
  glow,
  onTouchDown = false,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  children,
}: Props) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  // Set when a touch already fired the key, so the release doesn't fire it twice.
  // VoiceOver's double-tap sends only a press, so it still works.
  const firedOnTouch = useRef(false);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[{ flex }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPressIn={() => {
          if (!reduceMotion) scale.value = withSpring(0.88, { damping: 14, stiffness: 520 });
          if (onTouchDown) {
            firedOnTouch.current = true;
            onPress();
          }
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 7, stiffness: 300 });
          setTimeout(() => (firedOnTouch.current = false), 0);
        }}
        onPress={() => {
          if (firedOnTouch.current) firedOnTouch.current = false;
          else onPress();
        }}
        onLongPress={onLongPress}
        delayLongPress={450}
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
