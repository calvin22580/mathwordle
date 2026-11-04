import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Sizes the board and keypad to fill the screen without scrolling. */
export function useGameLayout(length: number, rows: number) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(width, 560) - 24;
  const usableHeight = height - insets.top - insets.bottom;

  const keyHeight = Math.round(Math.max(48, Math.min(64, usableHeight * 0.072)));
  const keypadHeight = keyHeight * 4 + 8 * 3;
  const chrome = 64 /* header */ + 56 /* message area */ + 24;
  const gap = length >= 8 ? 5 : 7;

  const byWidth = (contentWidth - gap * (length - 1)) / length;
  const byHeight = (usableHeight - keypadHeight - chrome - gap * (rows - 1)) / rows;
  const tileSize = Math.floor(Math.max(30, Math.min(68, byWidth, byHeight)));

  return { tileSize, gap, keyHeight, contentWidth };
}
