// src/stores/uiStore.ts
import { create } from "zustand";
import * as Haptics from "expo-haptics";

interface UiState {
  selectedDate: string;
  hapticsEnabled: boolean;
  setSelectedDate: (date: string) => void;
  goToToday: () => void;
  toggleHaptics: () => void;
  hapticFeedback: (type?: "light"|"medium"|"heavy") => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  selectedDate: new Date().toISOString().split("T")[0],
  hapticsEnabled: true,
  setSelectedDate: (date) => set({ selectedDate: date }),
  goToToday: () => set({ selectedDate: new Date().toISOString().split("T")[0] }),
  toggleHaptics: () => set((s) => ({ hapticsEnabled: !s.hapticsEnabled })),
  hapticFeedback: (type = "light") => {
    if (!get().hapticsEnabled) return;
    const m = { light: Haptics.ImpactFeedbackStyle.Light, medium: Haptics.ImpactFeedbackStyle.Medium, heavy: Haptics.ImpactFeedbackStyle.Heavy };
    Haptics.impactAsync(m[type]);
  },
}));
