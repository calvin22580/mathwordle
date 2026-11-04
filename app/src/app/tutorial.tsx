import { score } from "@sumsleuth/engine";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { AppText } from "@/components/AppText";
import { Board } from "@/components/Board";
import { Button } from "@/components/Button";
import { Confetti } from "@/components/Confetti";
import { Keypad } from "@/components/Keypad";
import { Header, Screen } from "@/components/Screen";
import { useSettings } from "@/state/settings";
import { useGame } from "@/state/useGame";
import { useGameLayout } from "@/state/useLayout";
import { useTheme } from "@/theme/ThemeProvider";

const ANSWER = "4+3=7";
const FIRST_GUESS = "3+5=8";
const ROWS = 3;

type Step = "intro" | "type1" | "green" | "purple" | "grey" | "type2" | "done";

export default function Tutorial() {
  const { palette } = useTheme();
  const setSettings = useSettings((s) => s.set);
  const scorer = useCallback((g: string) => score(g, ANSWER), []);
  const game = useGame(5, scorer, ROWS);
  const layout = useGameLayout(5, ROWS + 2);
  const [step, setStep] = useState<Step>("intro");
  const [burst, setBurst] = useState(0);

  // Advance when a guided guess finishes revealing.
  useEffect(() => {
    if (game.revealing) return;
    if (step === "type1" && game.rows.length === 1) setStep("green");
    if (step === "type2" && game.status === "won") {
      setStep("done");
      setBurst((b) => b + 1);
    }
  }, [game.revealing, game.rows.length, game.status, step]);

  const finish = () => {
    setSettings({ tutorialSeen: true });
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const target = step === "type1" ? FIRST_GUESS : step === "type2" ? ANSWER : null;
  const typed = Array.from(game.current);
  const onlyKey =
    target === null || game.revealing
      ? "none"
      : typed.length < Array.from(target).length
        ? Array.from(target)[typed.length]!
        : "enter";

  const highlights: [number, number][] =
    step === "green" ? [[0, 1], [0, 3]] : step === "purple" ? [[0, 0]] : step === "grey" ? [[0, 2], [0, 4]] : [];

  const copy: Record<Step, { title: string; body: string }> = {
    intro: {
      title: "Find the hidden sum",
      body: "You have 6 guesses. Every guess must be a true sum of the right length, like 3+5=8. The colours tell you how close you are.",
    },
    type1: { title: "Make your first guess", body: "Type 3+5=8 on the keypad, then press Enter." },
    green: { title: "Green: right spot", body: "Green means that character is in the right place. The + and the = are exactly right." },
    purple: { title: "Purple: wrong spot", body: "Purple means it's in the sum, but somewhere else. There is a 3, just not at the start." },
    grey: { title: "Grey: not in it", body: "Grey means it isn't in the sum at all. There's no 5 and no 8." },
    type2: { title: "Now solve it", body: "The hidden sum is 4+3=7. Type it in and press Enter." },
    done: {
      title: "You've got it!",
      body: "That's all there is to it. Stuck? Tap the light bulb during a game to see your clues spelled out.",
    },
  };

  const next: Partial<Record<Step, Step>> = { intro: "type1", green: "purple", purple: "grey", grey: "type2" };

  return (
    <Screen>
      <Header
        title="How to play"
        right={
          <Pressable onPress={finish} accessibilityRole="button" accessibilityLabel="Skip the tutorial" style={styles.skip}>
            <AppText weight="bold" color={palette.accent}>
              Skip
            </AppText>
          </Pressable>
        }
      />
      <Animated.View key={step} entering={FadeInDown.springify().damping(16)} style={styles.copy} accessibilityLiveRegion="polite">
        <AppText variant="title" weight="heavy" align="center">
          {copy[step].title}
        </AppText>
        <AppText align="center">{copy[step].body}</AppText>
      </Animated.View>
      <View style={styles.board}>
        <Board
          rows={game.rows}
          current={game.current}
          length={5}
          maxRows={ROWS}
          tileSize={Math.min(layout.tileSize, 56)}
          gap={layout.gap}
          shakeKey={game.shakeKey}
          revealRow={game.revealRow}
          bounceRow={game.status === "won" ? game.rows.length - 1 : null}
          highlights={highlights}
        />
      </View>
      <View style={styles.bottom}>
        {next[step] ? (
          <Animated.View entering={FadeIn.delay(250)}>
            <Button label={step === "intro" ? "Show me" : "Next"} onPress={() => setStep(next[step]!)} />
          </Animated.View>
        ) : step === "done" ? (
          <Animated.View entering={FadeIn.delay(900)}>
            <Button label="Start playing" onPress={finish} />
          </Animated.View>
        ) : (
          <Keypad
            onKey={game.type}
            onDelete={game.del}
            onEnter={game.submit}
            keyMarks={game.keyMarks}
            keyHeight={layout.keyHeight}
            onlyKey={onlyKey}
          />
        )}
      </View>
      <Confetti burst={burst} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  skip: { minHeight: 48, minWidth: 64, alignItems: "flex-end", justifyContent: "center", paddingHorizontal: 8 },
  copy: { gap: 8, paddingHorizontal: 8, minHeight: 150, justifyContent: "center" },
  board: { flex: 1, justifyContent: "center", alignItems: "center" },
  bottom: { paddingTop: 12, paddingBottom: 8 },
});
