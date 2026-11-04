import type { Mark } from "@sumsleuth/engine";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme/ThemeProvider";
import { fonts } from "@/theme/typography";

export const FLIP_MS = 420;
export const FLIP_STAGGER_MS = 260;

const MARK_LABEL: Record<Mark, string> = {
  correct: "right place",
  present: "in the sum, wrong place",
  absent: "not in the sum",
};

const SPOKEN: Record<string, string> = {
  "+": "plus",
  "−": "minus",
  "×": "times",
  "÷": "divided by",
  "=": "equals",
};

interface Props {
  char: string;
  mark?: Mark;
  index: number;
  size: number;
  /** Animate the reveal (flip) when the mark arrives. */
  reveal?: boolean;
  /** Celebrate: a little hop after a win. */
  bounce?: boolean;
  highlight?: boolean;
}

export function Tile({ char, mark, index, size, reveal = false, bounce = false, highlight = false }: Props) {
  const { palette, highContrast } = useTheme();
  const reduceMotion = useReducedMotion();
  const flip = useSharedValue(mark && !reveal ? 1 : 0);
  const pop = useSharedValue(1);
  const hop = useSharedValue(0);

  // Pop when a character is typed.
  useEffect(() => {
    if (char && !mark && !reduceMotion) {
      pop.value = withSequence(withTiming(1.12, { duration: 70 }), withSpring(1, { damping: 9, stiffness: 260 }));
    }
  }, [char, mark, pop, reduceMotion]);

  // Gentle pulse on tiles the tutorial is talking about.
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (highlight && !reduceMotion) {
      pulse.value = withRepeat(withSequence(withTiming(1.1, { duration: 450 }), withTiming(1, { duration: 450 })), -1);
    } else {
      pulse.value = withTiming(1, { duration: 150 });
    }
  }, [highlight, pulse, reduceMotion]);

  // Flip when the colour is revealed.
  useEffect(() => {
    if (!mark) {
      flip.value = 0;
      return;
    }
    if (!reveal || reduceMotion) {
      flip.value = withDelay(reduceMotion && reveal ? index * 80 : 0, withTiming(1, { duration: reduceMotion ? 120 : 0 }));
      return;
    }
    flip.value = withDelay(
      index * FLIP_STAGGER_MS,
      withTiming(1, { duration: FLIP_MS, easing: Easing.inOut(Easing.cubic) }),
    );
  }, [mark, reveal, index, flip, reduceMotion]);

  useEffect(() => {
    if (bounce && !reduceMotion) {
      hop.value = withDelay(
        index * 90,
        withSequence(withTiming(-size * 0.35, { duration: 160 }), withSpring(0, { damping: 6, stiffness: 220 })),
      );
    }
  }, [bounce, index, hop, size, reduceMotion]);

  const filled = palette.tileEmpty;
  const markColor = mark ? palette.marks[mark] : filled;

  const style = useAnimatedStyle(() => {
    const shown = flip.value >= 0.5;
    const angle = interpolate(flip.value, [0, 0.5, 1], [0, 90, 0]);
    return {
      transform: [{ translateY: hop.value }, { scale: pop.value * pulse.value }, { perspective: 600 }, { rotateX: `${angle}deg` }],
      backgroundColor: shown ? markColor : filled,
      borderColor: shown ? markColor : char ? palette.tileFilledBorder : palette.tileBorder,
    };
  });

  const textStyle = useAnimatedStyle(() => ({
    color: flip.value >= 0.5 ? palette.onMark : palette.text,
  }));

  const marker = highContrast && mark && mark !== "absent";
  const label = char
    ? `${SPOKEN[char] ?? char}${mark ? `, ${MARK_LABEL[mark]}` : ""}`
    : `empty tile ${index + 1}`;

  return (
    <Animated.View
      accessible
      accessibilityLabel={label}
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: Math.max(6, size * 0.14) },
        highlight && { shadowColor: palette.accent, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
        style,
      ]}
    >
      <Animated.Text
        allowFontScaling={false}
        style={[styles.char, { fontFamily: fonts.heavy, fontSize: size * 0.56 }, textStyle]}
      >
        {char}
      </Animated.Text>
      {marker ? (
        <View style={[styles.marker, { top: size * 0.02, right: size * 0.07 }]}>
          <Text allowFontScaling={false} style={{ color: palette.onMark, fontSize: size * 0.3, fontFamily: fonts.heavy }}>
            {mark === "correct" ? "✓" : "•"}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    backfaceVisibility: "hidden",
  },
  char: { includeFontPadding: false, textAlign: "center" },
  marker: { position: "absolute" },
});
