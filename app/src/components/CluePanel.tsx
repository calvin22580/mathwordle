import { explain, type Mark } from "@sumsleuth/engine";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ThemeProvider";

import { AppText } from "./AppText";
import type { BoardRow } from "./Board";
import { Button } from "./Button";
import { Tile } from "./Tile";

interface Props {
  visible: boolean;
  onClose: () => void;
  rows: BoardRow[];
  length: number;
}

/** "Explain my clues": what the colours so far tell you, in plain English. */
export function CluePanel({ visible, onClose, rows, length }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const clues = explain(rows.map((r) => [r.guess, r.marks] as [string, Mark[]]), length);
  const size = Math.min(44, Math.floor(300 / length));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.scrim, { backgroundColor: palette.scrim }]} onPress={onClose} accessibilityLabel="Close clues" />
      <View style={[styles.sheet, { backgroundColor: palette.surfaceRaised, paddingBottom: insets.bottom + 20 }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <AppText variant="title" weight="heavy">
            Your clues so far
          </AppText>
          {rows.length === 0 ? (
            <AppText muted>Make a guess first. Any true sum of the right length will do.</AppText>
          ) : (
            <>
              <View style={styles.section}>
                <AppText weight="bold">Known spots</AppText>
                <View style={styles.tiles} accessibilityLabel={`Known spots: ${clues.lines[0]}`}>
                  {clues.known.map((ch, i) => (
                    <Tile key={i} index={i} char={ch ?? ""} mark={ch ? "correct" : undefined} size={size} />
                  ))}
                </View>
                {clues.known.every((k) => k === null) ? (
                  <AppText muted variant="small">
                    No green tiles yet.
                  </AppText>
                ) : null}
              </View>
              <ClueLine
                title="In it, wrong spot"
                chars={clues.wrongSpot}
                mark="present"
                empty="Nothing in the wrong spot right now."
                size={size}
              />
              <ClueLine title="Not in it" chars={clues.notInIt} mark="absent" empty="Nothing ruled out yet." size={size} />
              <AppText muted variant="small">
                Remember: every guess has to be a true sum, so use it to test the numbers you're unsure about.
              </AppText>
            </>
          )}
          <Button label="Back to the puzzle" onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function ClueLine({ title, chars, mark, empty, size }: { title: string; chars: string[]; mark: Mark; empty: string; size: number }) {
  return (
    <View style={styles.section} accessible accessibilityLabel={`${title}: ${chars.length ? chars.join(", ") : empty}`}>
      <AppText weight="bold">{title}</AppText>
      {chars.length ? (
        <View style={styles.tiles}>
          {chars.map((ch, i) => (
            <Tile key={ch} index={i} char={ch} mark={mark} size={size} />
          ))}
        </View>
      ) : (
        <AppText muted variant="small">
          {empty}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1 },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%", width: "100%", maxWidth: 640, alignSelf: "center" },
  content: { padding: 24, gap: 20 },
  section: { gap: 8 },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
