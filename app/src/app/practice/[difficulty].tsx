import { DIFFICULTIES, MAX_GUESSES, randomPuzzle, score, validate, type Difficulty } from "@sumsleuth/engine";
import { router, useIsFocused, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Board } from "@/components/Board";
import { CluePanel } from "@/components/CluePanel";
import { Confetti } from "@/components/Confetti";
import { IconButton } from "@/components/IconButton";
import { Keypad } from "@/components/Keypad";
import { ResultCard } from "@/components/ResultCard";
import { Header, Screen } from "@/components/Screen";
import { Toast } from "@/components/Toast";
import { usePractice, type SavedGame } from "@/state/practice";
import { useGame } from "@/state/useGame";
import { useGameLayout } from "@/state/useLayout";
import { usePhysicalKeyboard } from "@/state/usePhysicalKeyboard";

const TITLES: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

const isDifficulty = (d: string | undefined): d is Difficulty => !!d && Object.prototype.hasOwnProperty.call(DIFFICULTIES, d);

/** A saved game is only picked up again if it still fits today's rules. */
function usable(game: SavedGame | undefined, length: number): game is SavedGame {
  return (
    !!game &&
    validate(game.answer, length).ok &&
    game.rows.every((r) => Array.from(r.guess).length === length && r.marks.length === length)
  );
}

export default function Practice() {
  const params = useLocalSearchParams<{ difficulty: string }>();
  const difficulty: Difficulty = isDifficulty(params.difficulty) ? params.difficulty : "medium";
  const length = DIFFICULTIES[difficulty];
  const focused = useIsFocused();
  const save = usePractice((s) => s.save);

  const [saved] = useState(() => {
    const g = usePractice.getState().saved[difficulty];
    return usable(g, length) ? g : null;
  });
  const [answer, setAnswer] = useState(() => saved?.answer ?? randomPuzzle(length));
  const scorer = useCallback((guess: string) => score(guess, answer), [answer]);
  const game = useGame(length, scorer, MAX_GUESSES, saved?.rows);

  // Keep the unfinished game so closing the app or going back never loses it.
  useEffect(() => {
    save(difficulty, game.status === "playing" && game.rows.length > 0 ? { answer, rows: game.rows } : null);
  }, [answer, difficulty, game.rows, game.status, save]);
  const layout = useGameLayout(length, MAX_GUESSES);
  const [cluesOpen, setCluesOpen] = useState(false);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (game.status === "won") setBurst((b) => b + 1);
  }, [game.status]);

  const next = () => {
    setAnswer(randomPuzzle(length));
    game.reset();
  };

  usePhysicalKeyboard(game.type, game.del, game.submit, focused && game.status === "playing" && !cluesOpen);

  const done = game.status !== "playing";

  return (
    <Screen>
      <Header
        title={TITLES[difficulty]}
        left={<IconButton name="chevron-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />}
        right={
          <>
            <IconButton name="bulb-outline" label="Explain my clues" onPress={() => setCluesOpen(true)} />
            <IconButton name="help-circle-outline" label="How to play" onPress={() => router.push("/tutorial")} />
          </>
        }
      />
      <View style={styles.message}>
        {game.error ? <Toast key={game.error.id} message={game.error.message} onDone={game.clearError} /> : null}
      </View>
      <View style={styles.board}>
        <Board
          rows={game.rows}
          current={game.current}
          length={length}
          maxRows={MAX_GUESSES}
          // Shrink the board when the result card replaces the keypad, so every row stays visible.
          tileSize={done && !game.revealing ? Math.floor(layout.tileSize * 0.7) : layout.tileSize}
          gap={layout.gap}
          shakeKey={game.shakeKey}
          revealRow={game.revealRow}
          bounceRow={game.status === "won" ? game.rows.length - 1 : null}
        />
      </View>
      <View style={styles.bottom}>
        {done && !game.revealing ? (
          <ResultCard
            won={game.status === "won"}
            guesses={game.rows.length}
            maxGuesses={MAX_GUESSES}
            answer={answer}
            nextLabel="New puzzle"
            onNext={next}
            onHome={() => router.replace("/")}
          />
        ) : (
          <Keypad
            onKey={game.type}
            onDelete={game.del}
            onClear={game.clear}
            onEnter={game.submit}
            keyMarks={game.keyMarks}
            keyHeight={layout.keyHeight}
          />
        )}
      </View>
      <CluePanel visible={cluesOpen} onClose={() => setCluesOpen(false)} rows={game.rows} length={length} />
      <Confetti burst={burst} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  message: { minHeight: 56, justifyContent: "center", zIndex: 10 },
  board: { flex: 1, justifyContent: "center", alignItems: "center" },
  bottom: { paddingTop: 12, paddingBottom: 8 },
});
