import Ionicons from "@expo/vector-icons/Ionicons";
import { DIVIDE, MINUS, TIMES, type Mark } from "@sumsleuth/engine";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";
import { fonts } from "@/theme/typography";

import { Key } from "./Key";

const ROWS = [
  ["1", "2", "3", "4", "5"],
  ["6", "7", "8", "9", "0"],
  ["+", MINUS, TIMES, DIVIDE, "="],
];

const SPOKEN: Record<string, string> = { "+": "plus", [MINUS]: "minus", [TIMES]: "times", [DIVIDE]: "divide", "=": "equals" };

interface Props {
  onKey: (ch: string) => void;
  onDelete: () => void;
  /** Hold Delete to clear the whole row. */
  onClear?: () => void;
  onEnter: () => void;
  keyMarks: Partial<Record<string, Mark>>;
  keyHeight: number;
  /** Tutorial: only this key works and it glows. "enter" and "delete" name those keys. */
  onlyKey?: string | null;
  disabled?: boolean;
}

export function Keypad({ onKey, onDelete, onClear, onEnter, keyMarks, keyHeight, onlyKey, disabled }: Props) {
  const { palette } = useTheme();
  const locked = (k: string) => disabled || (onlyKey != null && onlyKey !== k);
  const labelSize = Math.min(30, keyHeight * 0.48);

  return (
    <View style={styles.pad}>
      {ROWS.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((ch) => {
            const mark = keyMarks[ch];
            return (
              <Key
                key={ch}
                height={keyHeight}
                background={mark ? palette.marks[mark] : palette.key}
                onPress={() => onKey(ch)}
                disabled={locked(ch)}
                glow={onlyKey === ch}
                onTouchDown
                accessibilityLabel={`${SPOKEN[ch] ?? ch}${mark === "absent" ? ", not in the sum" : mark === "present" ? ", in the sum" : mark === "correct" ? ", placed" : ""}`}
              >
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: fonts.heavy, fontSize: labelSize, color: mark ? palette.onMark : palette.keyText }}
                >
                  {ch}
                </Text>
              </Key>
            );
          })}
        </View>
      ))}
      <View style={styles.row}>
        <Key
          height={keyHeight}
          flex={2}
          background={palette.key}
          onPress={onDelete}
          onLongPress={onClear}
          onTouchDown
          disabled={locked("delete")}
          glow={onlyKey === "delete"}
          accessibilityLabel="Delete"
          accessibilityHint={onClear ? "Hold to clear the row" : undefined}
        >
          <View style={styles.inline}>
            <Ionicons name="backspace-outline" size={labelSize * 0.9} color={palette.keyText} />
            <Text allowFontScaling={false} style={[styles.word, { color: palette.keyText, fontSize: labelSize * 0.62 }]}>
              Delete
            </Text>
          </View>
        </Key>
        <Key
          height={keyHeight}
          flex={3}
          background={palette.accent}
          onPress={onEnter}
          disabled={locked("enter")}
          glow={onlyKey === "enter"}
          accessibilityLabel="Enter guess"
        >
          <Text allowFontScaling={false} style={[styles.word, { color: palette.onAccent, fontSize: labelSize * 0.7 }]}>
            Enter
          </Text>
        </Key>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: 8, width: "100%" },
  row: { flexDirection: "row", gap: 7 },
  inline: { flexDirection: "row", alignItems: "center", gap: 6 },
  word: { fontFamily: fonts.heavy },
});
