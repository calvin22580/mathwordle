import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

import { useSettings } from "@/state/settings";

const sources = {
  key: require("../../assets/sounds/key.wav"),
  flip: require("../../assets/sounds/flip.wav"),
  win: require("../../assets/sounds/win.wav"),
  invalid: require("../../assets/sounds/invalid.wav"),
} as const;

type SoundName = keyof typeof sources;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let modeSet = false;

function player(name: SoundName): AudioPlayer {
  if (!modeSet) {
    modeSet = true;
    // Respect the silent switch and mix with the player's own music.
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" }).catch(() => undefined);
  }
  return (players[name] ??= createAudioPlayer(sources[name]));
}

export function playSound(name: SoundName) {
  if (!useSettings.getState().sounds) return;
  try {
    const p = player(name);
    p.seekTo(0);
    p.play();
  } catch {
    // Sound is decoration; never let it break the game.
  }
}
