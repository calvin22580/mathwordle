import Constants from "expo-constants";
import { router } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Header, Screen } from "@/components/Screen";
import { Tile } from "@/components/Tile";
import { BRAND } from "@/services/brand";
import { useSettings, type Appearance } from "@/state/settings";
import { useTheme } from "@/theme/ThemeProvider";
import type { TextScale } from "@/theme/typography";

const VERSION = [Constants.expoConfig?.version, Constants.expoConfig?.ios?.buildNumber && `(${Constants.expoConfig.ios.buildNumber})`]
  .filter(Boolean)
  .join(" ");

export default function Settings() {
  const s = useSettings();
  return (
    <Screen>
      <Header
        title="Settings"
        left={<IconButton name="chevron-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Appearance">
          <Segmented<Appearance>
            label="Theme"
            value={s.appearance}
            options={[
              ["system", "Automatic"],
              ["light", "Light"],
              ["dark", "Dark"],
            ]}
            onChange={(appearance) => s.set({ appearance })}
          />
          <Toggle
            label="Colour-blind colours"
            hint="Orange and blue tiles with tick and dot markers, plus stronger contrast."
            value={s.highContrast}
            onChange={(highContrast) => s.set({ highContrast })}
          />
          <Preview />
          <Segmented<TextScale>
            label="Text size"
            value={s.textScale}
            options={[
              ["standard", "Standard"],
              ["large", "Large"],
              ["xlarge", "Largest"],
            ]}
            onChange={(textScale) => s.set({ textScale })}
          />
          <AppText muted variant="small">
            Your phone's own text size setting is used as well.
          </AppText>
        </Section>

        <Section title="Sound and feel">
          <Toggle label="Sounds" hint="Soft clicks and a chime when you win." value={s.sounds} onChange={(sounds) => s.set({ sounds })} />
          {Platform.OS !== "web" ? (
            <Toggle label="Vibration" hint="A gentle tap on every key and tile." value={s.haptics} onChange={(haptics) => s.set({ haptics })} />
          ) : null}
        </Section>

        <Section title="Help">
          <Button label="Show me how to play" kind="secondary" onPress={() => router.push("/tutorial")} />
        </Section>

        <AppText muted variant="small" align="center">
          {BRAND.name} · version {VERSION}
        </AppText>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <View style={styles.section}>
      <AppText weight="heavy" variant="large" accessibilityRole="header">
        {title}
      </AppText>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>{children}</View>
    </View>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      style={styles.toggle}
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={hint}
    >
      <View style={{ flex: 1 }}>
        <AppText weight="bold">{label}</AppText>
        {hint ? (
          <AppText muted variant="small">
            {hint}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: palette.accent, false: palette.key }}
        importantForAccessibility="no"
        accessibilityElementsHidden
      />
    </Pressable>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  const { palette } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <AppText weight="bold">{label}</AppText>
      <View style={[styles.segmented, { backgroundColor: palette.key }]} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map(([v, text]) => {
          const on = v === value;
          return (
            <Pressable
              key={v}
              onPress={() => onChange(v)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={text}
              style={[styles.segment, on && { backgroundColor: palette.surfaceRaised, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 }]}
            >
              <AppText weight={on ? "heavy" : "bold"} variant="small" align="center" color={on ? palette.text : palette.textMuted}>
                {text}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Preview() {
  return (
    <View style={styles.preview} accessibilityLabel="Example tiles: green, purple and grey">
      <Tile index={0} char="4" mark="correct" size={44} />
      <Tile index={1} char="+" mark="present" size={44} />
      <Tile index={2} char="3" mark="absent" size={44} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40, gap: 24 },
  section: { gap: 10 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 18 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48 },
  segmented: { flexDirection: "row", borderRadius: 12, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 46, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  preview: { flexDirection: "row", gap: 8, justifyContent: "center" },
});
