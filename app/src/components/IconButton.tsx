import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

interface Props {
  name: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}

/** A 48×48 minimum tap target with an icon and a spoken label. */
export function IconButton({ name, label, onPress }: Props) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.button, { backgroundColor: pressed ? palette.key : "transparent" }]}
    >
      <Ionicons name={name} size={28} color={palette.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
});
