import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Difficulty } from "@sumsleuth/engine";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { BoardRow } from "@/components/Board";

export interface SavedGame {
  answer: string;
  rows: BoardRow[];
}

interface PracticeState {
  /** The unfinished practice game for each difficulty, so leaving the app never loses it. */
  saved: Partial<Record<Difficulty, SavedGame>>;
  save: (difficulty: Difficulty, game: SavedGame | null) => void;
}

export const usePractice = create<PracticeState>()(
  persist(
    (set) => ({
      saved: {},
      save: (difficulty, game) =>
        set((s) => {
          const saved = { ...s.saved };
          if (game) saved[difficulty] = game;
          else delete saved[difficulty];
          return { saved };
        }),
    }),
    {
      name: "practice-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ saved }) => ({ saved }),
    },
  ),
);
