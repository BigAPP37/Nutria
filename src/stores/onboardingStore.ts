// src/stores/onboardingStore.ts
// Store Zustand dedicado al flujo de onboarding.
// Vive solo durante el onboarding — se resetea al completar.
// NO contamina authStore ni uiStore.

import { create } from "zustand";

export type BiologicalSex = "male" | "female";
export type UserGoal = "lose_weight" | "maintain" | "gain_muscle";
export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";
export type TcaScreeningAnswer =
  | "very_positive"
  | "positive"
  | "neutral"
  | "complicated"
  | "prefer_not_to_say";

export interface OnboardingState {
  // Datos recopilados paso a paso
  displayName: string;
  weightKg: number | null;
  heightCm: number | null;
  dateOfBirth: string | null;
  biologicalSex: BiologicalSex | null;
  goal: UserGoal | null;
  activityLevel: ActivityLevel | null;
  tcaScreening: TcaScreeningAnswer | null;
  countryCode: string;
  unitWeight: "kg" | "lb";
  unitEnergy: "kcal" | "kJ";
  timezone: string;

  // Control del flujo
  currentStep: number;
  isSubmitting: boolean;
  submitError: string | null;

  // Acciones
  setField: <K extends keyof OnboardingState>(
    key: K,
    value: OnboardingState[K]
  ) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSubmitting: (v: boolean) => void;
  setSubmitError: (msg: string | null) => void;
  reset: () => void;
}

const initialState = {
  displayName: "",
  weightKg: null,
  heightCm: null,
  dateOfBirth: null,
  biologicalSex: null,
  goal: null,
  activityLevel: null,
  tcaScreening: null,
  countryCode: "ES",
  unitWeight: "kg" as const,
  unitEnergy: "kcal" as const,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid",
  currentStep: 1,
  isSubmitting: false,
  submitError: null,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setField: (key, value) => set({ [key]: value } as Partial<OnboardingState>),

  nextStep: () =>
    set((s) => ({ currentStep: Math.min(s.currentStep + 1, 7) })),

  prevStep: () =>
    set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

  setSubmitting: (v) => set({ isSubmitting: v }),

  setSubmitError: (msg) => set({ submitError: msg }),

  reset: () => set(initialState),
}));
