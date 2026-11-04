import Ionicons from "@expo/vector-icons/Ionicons";
import type { Difficulty, Mark } from "@sumsleuth/engine";
import { Redirect, router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Header, Screen } from "@/components/Screen";
import { Tile } from "@/components/Tile";
import { BRAND } from "@/services/brand";
import { useSettings } from "@/state/settings";
import { useTheme } from "@/theme/ThemeProvider";

const LOGO: [string, Mark][] = [
  ["9", "correct"],
  ["÷", "present"],
  ["3", "absent"],
  ["=", "correct"],
  ["3", "present"],
];

const MODES: { difficulty: Difficulty; label: string; subtitle: string }[] = [
  { difficulty: "easy", label: "Easy", subtitle: "5 tiles, like 3+4=7" },
  { difficulty: "medium", label: "Medium", subtitle: "6 tiles, like 12÷3=4" },
  { difficulty: "hard", label: "Hard", subtitle: "8 tiles, like 9÷3×9=27" },
];

export default function Home() {
  const { palette } = useTheme();
  const tutorialSeen = useSettings((s) => s.tutorialSeen);
  if (!tutorialSeen) return <Redirect href="/tutorial" />;

  return (
    <Screen>
      <Header
        right={
          <>
            <IconButton name="help-circle-outline" label="How to play" onPress={() => router.push("/tutorial")} />
            <IconButton name="settings-outline" label="Settings" onPress={() => router.push("/settings")} />
          </>
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.hero}>
          <View style={styles.logo} accessible={false} importantForAccessibility="no-hide-descendants">
            {LOGO.map(([ch, mark], i) => (
              <Tile key={i} index={i} char={ch} mark={mark} size={46} />
            ))}
          </View>
          <AppText variant="display" weight="heavy" align="center" accessibilityRole="header">
            {BRAND.name}
          </AppText>
          <AppText align="center" muted>
            {BRAND.tagline}
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify().damping(16)} style={styles.section}>
          <View style={[styles.daily, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Ionicons name="calendar-outline" size={30} color={palette.textMuted} />
            <View style={{ flex: 1 }}>
              <AppText weight="heavy" variant="large">
                Today's puzzle
              </AppText>
              <AppText muted variant="small">
                The daily puzzle, streaks and leaderboards arrive in the next build.
              </AppText>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).springify().damping(16)} style={styles.section}>
          <AppText weight="heavy" variant="large" accessibilityRole="header">
            Practice
          </AppText>
          <AppText muted variant="small">
            Fresh puzzles, as many as you like.
          </AppText>
          {MODES.map((m) => (
            <Button
              key={m.difficulty}
              label={m.label}
              subtitle={m.subtitle}
              kind={m.difficulty === "medium" ? "primary" : "secondary"}
              onPress={() => router.push({ pathname: "/practice/[difficulty]", params: { difficulty: m.difficulty } })}
            />
          ))}
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32, gap: 28 },
  hero: { alignItems: "center", gap: 8, paddingTop: 8 },
  logo: { flexDirection: "row", gap: 6, marginBottom: 8 },
  section: { gap: 12 },
  daily: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 16, borderWidth: 2, borderStyle: "dashed" },
});
