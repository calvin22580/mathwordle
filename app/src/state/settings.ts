import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { TextScale } from "@/theme/typography";

import { usePractice } from "./practice";

export type Appearance = "system" | "light" | "dark";

export interface Settings {
  appearance: Appearance;
  highContrast: boolean;
  textScale: TextScale;
  sounds: boolean;
  haptics: boolean;
  tutorialSeen: boolean;
  set: (patch: Partial<Omit<Settings, "set">>) => void;
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      appearance: "system",
      highContrast: false,
      textScale: "standard",
      sounds: false,
      haptics: true,
      tutorialSeen: false,
      set: (patch) => set(patch),
    }),
    {
      name: "settings-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ set: _set, ...rest }) => rest,
    },
  ),
);

const STORES = [useSettings, usePractice];
const allHydrated = () => STORES.every((s) => s.persist.hasHydrated());

/** True once saved settings and games have been loaded from storage. */
export function useSettingsLoaded(): boolean {
  const [loaded, setLoaded] = useState(allHydrated);
  useEffect(() => {
    const check = () => {
      if (allHydrated()) setLoaded(true);
    };
    check();
    const unsubscribes = STORES.map((s) => s.persist.onFinishHydration(check));
    return () => unsubscribes.forEach((u) => u());
  }, []);
  return loaded;
}
