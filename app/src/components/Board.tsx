import type { Mark } from "@sumsleuth/engine";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Tile } from "./Tile";

export interface BoardRow {
  guess: string;
  marks: Mark[];
}

interface Props {
  rows: BoardRow[];
  current: string;
  length: number;
  maxRows: number;
  tileSize: number;
  gap: number;
  /** Changes each time the current row should shake. */
  shakeKey: number;
  /** Index of the row whose reveal should animate (usually the newest). */
  revealRow: number | null;
  /** Row index that hops after a win. */
  bounceRow?: number | null;
  /** Tiles to glow (for the tutorial), as [row, col]. */
  highlights?: [number, number][];
}

export function Board({ rows, current, length, maxRows, tileSize, gap, shakeKey, revealRow, bounceRow, highlights }: Props) {
  const lines = Array.from({ length: maxRows }, (_, r) => {
    if (r < rows.length) return { chars: Array.from(rows[r]!.guess), marks: rows[r]!.marks };
    if (r === rows.length) return { chars: Array.from(current), marks: [] as Mark[] };
    return { chars: [] as string[], marks: [] as Mark[] };
  });

  return (
    <View style={{ gap }} accessibilityRole="grid" accessibilityLabel="Guesses">
      {lines.map((line, r) => (
        <Row key={r} shake={r === rows.length ? shakeKey : 0} gap={gap}>
          {Array.from({ length }, (_, c) => (
            <Tile
              key={c}
              index={c}
              char={line.chars[c] ?? ""}
              mark={line.marks[c]}
              size={tileSize}
              reveal={r === revealRow}
              bounce={r === bounceRow}
              highlight={highlights?.some(([hr, hc]) => hr === r && hc === c)}
            />
          ))}
        </Row>
      ))}
    </View>
  );
}

function Row({ shake, gap, children }: { shake: number; gap: number; children: React.ReactNode }) {
  const x = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!shake) return;
    const d = reduceMotion ? 4 : 12;
    x.value = withSequence(
      ...[-d, d, -d * 0.8, d * 0.8, -d * 0.4, d * 0.4, 0].map((v) => withTiming(v, { duration: 55 })),
    );
  }, [shake, x, reduceMotion]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return <Animated.View style={[styles.row, { gap }, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center" },
});
