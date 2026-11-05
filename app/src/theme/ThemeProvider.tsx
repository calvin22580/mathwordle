import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import { useSettings } from "@/state/settings";

import { getPalette, type Palette } from "./palettes";
import { textScales } from "./typography";

interface Theme {
  palette: Palette;
  scheme: "light" | "dark";
  highContrast: boolean;
  /** Multiplier from the in-app text-size setting (system Dynamic Type applies on top). */
  textScale: number;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const appearance = useSettings((s) => s.appearance);
  const highContrast = useSettings((s) => s.highContrast);
  const scale = useSettings((s) => s.textScale);

  const value = useMemo<Theme>(() => {
    const scheme = appearance === "system" ? (system === "dark" ? "dark" : "light") : appearance;
    return { palette: getPalette(scheme, highContrast), scheme, highContrast, textScale: textScales[scale] };
  }, [appearance, system, highContrast, scale]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme must be used inside ThemeProvider");
  return theme;
}
