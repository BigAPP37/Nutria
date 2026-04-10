// src/stores/premiumStore.ts
// Estado premium del usuario: nivel, límites y gates.
// El contador de fotos se resetea al inicio de cada día.
// Free: 5 fotos/día, 7 días historial, sin stats ni TDEE adaptativo.

import { create } from "zustand";
import { checkPremiumStatus } from "@/lib/purchases";
import { getTodayDateKey } from "@/lib/date";

const FREE_PHOTO_LIMIT = 5;
const FREE_HISTORY_DAYS = 7;

interface PremiumState {
  isPremium: boolean;
  isLoading: boolean;
  photoLogsToday: number;
  lastPhotoResetDate: string; // ISO date del último reset

  // Acciones
  checkPremium: (userId?: string) => Promise<void>;
  incrementPhotoLogs: () => void;
  resetPhotoLogs: () => void;
  setPremium: (value: boolean) => void;

  // Gates (lectura)
  canUsePhotoLog: () => boolean;
  canViewHistory: (daysBack: number) => boolean;
  canViewStats: () => boolean;
  canUseAdaptiveTdee: () => boolean;
  remainingPhotos: () => number;
}

export const usePremiumStore = create<PremiumState>((set, get) => ({
  isPremium: false,
  isLoading: true,
  photoLogsToday: 0,
  lastPhotoResetDate: getTodayDateKey(),

  checkPremium: async (userId?: string) => {
    set({ isLoading: true });
    try {
      const isPremium = await checkPremiumStatus(userId);
      set({ isPremium, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  incrementPhotoLogs: () => {
    const today = getTodayDateKey();
    const state = get();

    // Auto-reset si cambió el día
    if (state.lastPhotoResetDate !== today) {
      set({ photoLogsToday: 1, lastPhotoResetDate: today });
    } else {
      set({ photoLogsToday: state.photoLogsToday + 1 });
    }
  },

  resetPhotoLogs: () => {
    set({
      photoLogsToday: 0,
      lastPhotoResetDate: getTodayDateKey(),
    });
  },

  setPremium: (value) => set({ isPremium: value }),

  // ─── Gates ────────────────────────────────────────────────

  canUsePhotoLog: () => {
    const { isPremium, photoLogsToday, lastPhotoResetDate } = get();
    if (isPremium) return true;

    // Auto-reset si cambió el día
    const today = getTodayDateKey();
    if (lastPhotoResetDate !== today) {
      set({ photoLogsToday: 0, lastPhotoResetDate: today });
      return true;
    }

    return photoLogsToday < FREE_PHOTO_LIMIT;
  },

  canViewHistory: (daysBack: number) => {
    if (get().isPremium) return true;
    return daysBack <= FREE_HISTORY_DAYS;
  },

  canViewStats: () => {
    return get().isPremium;
  },

  canUseAdaptiveTdee: () => {
    return get().isPremium;
  },

  remainingPhotos: () => {
    const { isPremium, photoLogsToday } = get();
    if (isPremium) return Infinity;
    return Math.max(0, FREE_PHOTO_LIMIT - photoLogsToday);
  },
}));
