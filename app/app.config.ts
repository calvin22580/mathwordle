import type { ConfigContext, ExpoConfig } from "expo/config";

import brand from "../brand.json";

// Everything that names the game comes from brand.json at the repo root.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: brand.name,
  slug: brand.urlScheme,
  scheme: brand.urlScheme,
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: brand.iosBundleId,
    supportsTablet: true,
  },
  android: {
    package: brand.androidPackage,
    adaptiveIcon: {
      backgroundColor: "#6B4BCB",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "single",
    favicon: "./assets/images/favicon.png",
    name: brand.name,
    shortName: brand.name,
    themeColor: "#6B4BCB",
    backgroundColor: "#F7F5FC",
  },
  plugins: [
    "expo-router",
    "expo-audio",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#6B4BCB",
        image: "./assets/images/splash-icon.png",
        imageWidth: 160,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    brand,
  },
});
