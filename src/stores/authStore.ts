// Store de autenticación usando Zustand
// Maneja el estado del usuario autenticado en el cliente

import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/database'

interface AuthState {
  // Estado
  user: User | null
  profile: UserProfile | null
  isLoading: boolean

  // Acciones
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, profile: null, isLoading: false }),
}))
