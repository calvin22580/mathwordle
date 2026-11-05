import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useSettings } from "@/state/settings";

const enabled = () => Platform.OS !== "web" && useSettings.getState().haptics;
const quietly = (p: Promise<unknown>) => p.catch(() => undefined);

export const haptics = {
  key: () => enabled() && quietly(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  reveal: () => enabled() && quietly(Haptics.selectionAsync()),
  invalid: () => enabled() && quietly(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  win: () => enabled() && quietly(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  lose: () => enabled() && quietly(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
