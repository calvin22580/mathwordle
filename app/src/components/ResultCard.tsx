import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useTheme } from "@/theme/ThemeProvider";

import { AppText } from "./AppText";
import { Button } from "./Button";
import { Tile } from "./Tile";

const PRAISE = ["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great work!", "Phew, got it!"];

interface Props {
  won: boolean;
  guesses: number;
  maxGuesses: number;
  answer: string;
  onNext: () => void;
  nextLabel: string;
  onHome: () => void;
}

export function ResultCard({ won, guesses, maxGuesses, answer, onNext, nextLabel, onHome }: Props) {
  const { palette } = useTheme();
  const chars = Array.from(answer);
  const size = Math.min(40, Math.floor(280 / chars.length));
  return (
    <Animated.View
      entering={FadeInDown.delay(won ? 900 : 300).springify().damping(15)}
      style={[styles.card, { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}
      accessibilityLiveRegion="polite"
    >
      <AppText variant="title" weight="heavy" align="center">
        {won ? PRAISE[Math.min(guesses, PRAISE.length) - 1] : "So close!"}
      </AppText>
      <AppText align="center" muted>
        {won ? `Solved in ${guesses} of ${maxGuesses} guesses.` : "The hidden sum was:"}
      </AppText>
      {!won ? (
        <View style={styles.answer} accessibilityLabel={`The answer was ${answer}`}>
          {chars.map((ch, i) => (
            <Tile key={i} index={i} char={ch} mark="correct" size={size} />
          ))}
        </View>
      ) : null}
      <View style={styles.buttons}>
        <Button label={nextLabel} onPress={onNext} />
        <Button label="Home" kind="secondary" onPress={onHome} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    gap: 10,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  answer: { flexDirection: "row", justifyContent: "center", gap: 5, marginVertical: 6 },
  buttons: { gap: 10, marginTop: 6 },
});
