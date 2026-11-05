import type { Mark } from "@sumsleuth/engine";

export interface Palette {
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  onAccent: string;
  tileEmpty: string;
  tileBorder: string;
  tileFilledBorder: string;
  key: string;
  keyPressed: string;
  keyText: string;
  marks: Record<Mark, string>;
  onMark: string;
  danger: string;
  scrim: string;
  confetti: string[];
}

const light: Palette = {
  background: "#F7F5FC",
  surface: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  text: "#1D1A2B",
  textMuted: "#5E5874",
  border: "#DDD7EC",
  accent: "#6B4BCB",
  onAccent: "#FFFFFF",
  tileEmpty: "#FFFFFF",
  tileBorder: "#D4CDE6",
  tileFilledBorder: "#857DA0",
  key: "#E4DFF2",
  keyPressed: "#D3CCE9",
  keyText: "#1D1A2B",
  marks: { correct: "#2F9157", present: "#8556E8", absent: "#77718A" },
  onMark: "#FFFFFF",
  danger: "#C2413B",
  scrim: "rgba(20, 16, 36, 0.45)",
  confetti: ["#2F9157", "#8556E8", "#F2B33D", "#E8578A", "#3C8DDE"],
};

const dark: Palette = {
  background: "#13111B",
  surface: "#1E1B2A",
  surfaceRaised: "#272338",
  text: "#F3F0FA",
  textMuted: "#ABA5C0",
  border: "#363149",
  accent: "#9B80F0",
  onAccent: "#13111B",
  tileEmpty: "#13111B",
  tileBorder: "#3A3551",
  tileFilledBorder: "#79729A",
  key: "#575275",
  keyPressed: "#68628A",
  keyText: "#F3F0FA",
  marks: { correct: "#36985E", present: "#8B5EEF", absent: "#2C2839" },
  onMark: "#FFFFFF",
  danger: "#F07A72",
  scrim: "rgba(0, 0, 0, 0.6)",
  confetti: ["#36985E", "#8B5EEF", "#F2B33D", "#E8578A", "#3C8DDE"],
};

// Orange and blue stay distinct for every common type of colour blindness,
// and each tile also gets a shape marker in this mode.
const contrastMarksLight = { correct: "#D9601F", present: "#1F6FD1", absent: "#6B6578" };
const contrastMarksDark = { correct: "#F07A33", present: "#4A95F0", absent: "#2C2839" };

export function getPalette(scheme: "light" | "dark", highContrast: boolean): Palette {
  const base = scheme === "dark" ? dark : light;
  if (!highContrast) return base;
  return {
    ...base,
    marks: scheme === "dark" ? contrastMarksDark : contrastMarksLight,
    tileBorder: scheme === "dark" ? "#5A5475" : "#9C95B5",
    textMuted: scheme === "dark" ? "#C9C4DA" : "#45405A",
  };
}
