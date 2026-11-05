import { normalize } from "@sumsleuth/engine";
import { useEffect } from "react";
import { Platform } from "react-native";

/** On the web, let people type with a real keyboard: digits, + - * / x =, Enter and Backspace. */
export function usePhysicalKeyboard(onKey: (c: string) => void, onDelete: () => void, onEnter: () => void, active: boolean) {
  useEffect(() => {
    if (Platform.OS !== "web" || !active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") onEnter();
      else if (e.key === "Backspace") onDelete();
      else {
        const ch = normalize(e.key);
        if (ch.length === 1 && "0123456789+−×÷=".includes(ch)) onKey(ch);
        else return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onKey, onDelete, onEnter, active]);
}
