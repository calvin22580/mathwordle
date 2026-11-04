import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { TextScale } from "@/theme/typography";

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

/** True once saved settings have been loaded from storage. */
export function useSettingsLoaded(): boolean {
  const [loaded, setLoaded] = useState(() => useSettings.persist.hasHydrated());
  useEffect(() => {
    if (useSettings.persist.hasHydrated()) setLoaded(true);
    return useSettings.persist.onFinishHydration(() => setLoaded(true));
  }, []);
  return loaded;
}
