import {
  Nunito_500Medium,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/nunito";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useSettingsLoaded } from "@/state/settings";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Nunito_500Medium, Nunito_700Bold, Nunito_800ExtraBold });
  const settingsLoaded = useSettingsLoaded();
  const ready = (fontsLoaded || !!fontError) && settingsLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Navigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Navigator() {
  const { palette, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="practice/[difficulty]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="tutorial" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
      </Stack>
    </>
  );
}
