// src/stores/authStore.ts
import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  setSession: (session: Session | null) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  hasCompletedOnboarding: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setOnboardingCompleted: (completed) => set({ hasCompletedOnboarding: completed }),
  setLoading: (loading) => set({ isLoading: loading }),
  clear: () => set({ session: null, user: null, isLoading: false, hasCompletedOnboarding: false }),
}));
