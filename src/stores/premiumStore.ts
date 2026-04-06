// Store de Zustand para el estado Premium y control de fotos diarias
import { create } from 'zustand'

// Genera la clave de localStorage para el día de hoy
function getTodayKey(): string {
  const today = new Date().toISOString().split('T')[0]
  return `nutria_photo_logs_${today}`
}

interface PremiumStoreState {
  isPremium: boolean
  premiumExpiresAt: string | null
  photoLogsToday: number
  readonly maxFreePhotos: 3
  isLoading: boolean

  // Acciones
  setPremium(isPremium: boolean, expiresAt: string | null): void
  checkAndResetDailyPhotos(): void
  incrementPhotoLog(): void
  canUsePhoto(): boolean
  setLoading(v: boolean): void
}

export const usePremiumStore = create<PremiumStoreState>((set, get) => {
  // Inicialización: leer el conteo de fotos del día desde localStorage
  const loadPhotoCount = (): number => {
    if (typeof window === 'undefined') return 0
    const key = getTodayKey()
    const stored = localStorage.getItem(key)
    if (stored === null) return 0
    const parsed = parseInt(stored, 10)
    return isNaN(parsed) ? 0 : parsed
  }

  return {
    isPremium: true,
    premiumExpiresAt: null,
    photoLogsToday: loadPhotoCount(),
    maxFreePhotos: 3,
    isLoading: false,

    setPremium(isPremium: boolean, expiresAt: string | null) {
      set({ isPremium, premiumExpiresAt: expiresAt })
    },

    // Comprueba si la fecha almacenada es hoy; si no, resetea el conteo
    checkAndResetDailyPhotos() {
      if (typeof window === 'undefined') return
      const key = getTodayKey()
      const stored = localStorage.getItem(key)
      if (stored === null) {
        // No hay entrada para hoy — empezar en 0
        set({ photoLogsToday: 0 })
      } else {
        const parsed = parseInt(stored, 10)
        set({ photoLogsToday: isNaN(parsed) ? 0 : parsed })
      }
    },

    // Incrementa el conteo y persiste en localStorage
    incrementPhotoLog() {
      const current = get().photoLogsToday
      const next = current + 1
      if (typeof window !== 'undefined') {
        localStorage.setItem(getTodayKey(), String(next))
      }
      set({ photoLogsToday: next })
    },

    // El usuario puede usar foto si es premium o no ha llegado al límite
    canUsePhoto(): boolean {
      return get().isPremium || get().photoLogsToday < 3
    },

    setLoading(v: boolean) {
      set({ isLoading: v })
    },
  }
})
