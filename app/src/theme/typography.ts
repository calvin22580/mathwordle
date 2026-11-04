export const fonts = {
  regular: "Nunito_500Medium",
  bold: "Nunito_700Bold",
  heavy: "Nunito_800ExtraBold",
};

/** Base sizes, before the player's text-size setting and system Dynamic Type. */
export const sizes = {
  small: 15,
  body: 18,
  large: 21,
  title: 28,
  display: 36,
};

export const textScales = { standard: 1, large: 1.15, xlarge: 1.3 } as const;
export type TextScale = keyof typeof textScales;
