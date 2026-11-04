import { useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme/ThemeProvider";

const COUNT = 70;

/** A burst of confetti. Changing `burst` (a counter) fires it again. */
export function Confetti({ burst }: { burst: number }) {
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const { palette } = useTheme();

  const pieces = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        key: `${burst}-${i}`,
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * 160,
        delay: Math.random() * 350,
        duration: 1800 + Math.random() * 1400,
        spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720),
        w: 7 + Math.random() * 6,
        h: 10 + Math.random() * 8,
        color: palette.confetti[i % palette.confetti.length]!,
      })),
    // New pieces for every burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burst, width],
  );

  if (!burst || reduceMotion) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map(({ key, ...p }) => (
        <Piece key={key} {...p} fall={height + 60} />
      ))}
    </View>
  );
}

function Piece(p: { x: number; drift: number; delay: number; duration: number; spin: number; w: number; h: number; color: string; fall: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(p.delay, withTiming(1, { duration: p.duration, easing: Easing.out(Easing.quad) }));
  }, [t, p.delay, p.duration]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value > 0.85 ? (1 - t.value) / 0.15 : 1,
    transform: [
      { translateX: p.x + p.drift * t.value },
      { translateY: -40 + p.fall * t.value },
      { rotate: `${p.spin * t.value}deg` },
    ],
  }));
  return <Animated.View style={[styles.piece, { width: p.w, height: p.h, backgroundColor: p.color }, style]} />;
}

const styles = StyleSheet.create({
  piece: { position: "absolute", top: 0, left: 0, borderRadius: 2 },
});
