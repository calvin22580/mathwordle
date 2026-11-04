import { Text, type TextProps, type TextStyle } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";
import { fonts, sizes } from "@/theme/typography";

type Variant = keyof typeof sizes;

interface Props extends TextProps {
  variant?: Variant;
  weight?: keyof typeof fonts;
  color?: string;
  muted?: boolean;
  align?: TextStyle["textAlign"];
}

/** All app text: the game font, the player's text size, and system Dynamic Type. */
export function AppText({ variant = "body", weight = "regular", color, muted, align, style, ...rest }: Props) {
  const { palette, textScale } = useTheme();
  const size = sizes[variant] * textScale;
  return (
    <Text
      maxFontSizeMultiplier={variant === "display" || variant === "title" ? 1.4 : 2}
      {...rest}
      style={[
        {
          fontFamily: fonts[weight],
          fontSize: size,
          lineHeight: Math.round(size * 1.3),
          color: color ?? (muted ? palette.textMuted : palette.text),
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
