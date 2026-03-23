// src/hooks/useKeyboard.ts
import { useState, useEffect } from "react";
import { Keyboard } from "react-native";

export function useKeyboard() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const s1 = Keyboard.addListener("keyboardDidShow", () => setVisible(true));
    const s2 = Keyboard.addListener("keyboardDidHide", () => setVisible(false));
    return () => { s1.remove(); s2.remove(); };
  }, []);
  return { keyboardVisible: visible };
}
