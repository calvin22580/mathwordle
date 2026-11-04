import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeOut } from "react-native-reanimated";

import { useTheme } from "@/theme/ThemeProvider";

import { AppText } from "./AppText";

/** The plain-English reason shown above a rejected row. Read aloud by screen readers. */
export function Toast({ message, onDone, ms = 3600 }: { message: string; onDone: () => void; ms?: number }) {
  const { palette } = useTheme();
  useEffect(() => {
    const t = setTimeout(onDone, ms);
    return () => clearTimeout(t);
  }, [message, onDone, ms]);

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(16)}
      exiting={FadeOut.duration(180)}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={[styles.toast, { backgroundColor: palette.text }]}
    >
      <AppText weight="bold" align="center" color={palette.background}>
        {message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    maxWidth: 520,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
