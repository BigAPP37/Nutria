// Store del onboarding ampliado usando Zustand
// La secuencia de pantallas es dinámica según las respuestas del usuario

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserGoal, ActivityLevel, BiologicalSex } from '@/types/database'
import type {
  ScreenId,
  WeightLossExperience,
  FoodRelationship,
  EmotionalEatingFrequency,
  SnackingFrequency,
  CookingFrequency,
  EatsOutFrequency,
  WaterIntake,
  SleepQuality,
  StressLevel,
  CommitmentTime,
  LivingSituation,
  HouseholdSupport,
  AiTonePreference,
  TcaAnswer,
} from '@/types/onboarding'

// Datos acumulados durante el onboarding
export interface OnboardingData {
  // Datos personales básicos → user_profiles
  name: string
  weight_kg: number | null
  height_cm: number | null
  birth_date: string
  biological_sex: BiologicalSex | null
  target_weight_kg: number | null

  // Unidades de entrada (para conversión)
  weight_unit: 'kg' | 'lb'
  height_unit: 'cm' | 'ft'
  height_ft: number | null
  height_in: number | null
  weight_lb: number | null

  // Objetivo → user_profiles (valor mapeado a la BD)
  goal: UserGoal | null
  // Selección raw del usuario (puede ser 'improve_diet' o 'eat_healthy')
  goal_raw: string | null

  // Nivel de actividad → user_profiles
  activity_level: ActivityLevel | null

  // Screening TCA → user_profiles
  tca_answer: TcaAnswer | null
  tca_flagged: boolean

  // Preferencias de unidades → user_profiles
  country: string
  units_weight: 'kg' | 'lb'
  units_energy: 'kcal' | 'kJ'
  timezone: string

  // Contexto psicológico y conductual → user_context
  weight_loss_experience: WeightLossExperience | null
  past_diets: string[]
  food_relationship: FoodRelationship | null
  eating_triggers: string[]
  emotional_eating_frequency: EmotionalEatingFrequency | null
  biggest_challenges: string[]
  meals_per_day: number | null
  snacking_frequency: SnackingFrequency | null
  cooking_frequency: CookingFrequency | null
  eats_out_frequency: EatsOutFrequency | null
  water_intake: WaterIntake | null
  sleep_quality: SleepQuality | null
  stress_level: StressLevel | null
  diet_restrictions: string[]
  allergies: string[]
  secondary_goals: string[]
  commitment_time: CommitmentTime | null
  progress_tracking: string[]
  living_situation: LivingSituation | null
  household_support: HouseholdSupport | null
  ai_tone_preference: AiTonePreference | null
  wants_daily_tips: boolean
}

// Calcula la secuencia de pantallas a mostrar según los datos actuales
// Esta función es la fuente de verdad para la navegación condicional
export function getScreenSequence(data: OnboardingData): ScreenId[] {
  const screens: ScreenId[] = ['welcome', 'goal']

  // Pantallas condicionales de experiencia con la pérdida de peso
  if (data.goal === 'lose_weight') {
    screens.push('weight-experience')
    // Solo mostrar historial de dietas si no es la primera vez intentando
    if (data.weight_loss_experience && data.weight_loss_experience !== 'never_tried') {
      screens.push('past-diets')
    }
  }

  screens.push(
    'body-name',
    'body-about',
    'body-measurements',
    'activity-level',
    'education-restrictive-diets',
    'food-relationship',
    'eating-triggers',
    'emotional-eating',
    'biggest-challenges',
    'education-normal',
    'education-ai-scanner',
    'meals-routine',
    'lifestyle',
    'diet-restrictions',
    'secondary-goals',
    'commitment',
    'progress-tracking',
    'living-situation',
  )

  // Mostrar soporte del entorno solo si no vive solo
  if (data.living_situation && data.living_situation !== 'alone') {
    screens.push('household-support')
  }

  screens.push(
    'education-environment',
    'ai-preferences',
    'tca-screening',
    'ready',
    'register',
  )

  return screens
}

interface OnboardingState {
  currentScreen: ScreenId
  data: OnboardingData
  isSubmitting: boolean
  submitError: string | null

  // Navegación dinámica basada en la secuencia calculada
  nextScreen: () => void
  prevScreen: () => void
  goToScreen: (screen: ScreenId) => void

  // Actualizar datos del wizard
  updateData: (updates: Partial<OnboardingData>) => void
  setSubmitting: (submitting: boolean) => void
  setSubmitError: (error: string | null) => void
  reset: () => void
}

const initialData: OnboardingData = {
  name: '',
  weight_kg: null,
  height_cm: null,
  birth_date: '',
  biological_sex: null,
  target_weight_kg: null,
  weight_unit: 'kg',
  height_unit: 'cm',
  height_ft: null,
  height_in: null,
  weight_lb: null,
  goal: null,
  goal_raw: null,
  activity_level: null,
  tca_answer: null,
  tca_flagged: false,
  country: '',
  units_weight: 'kg',
  units_energy: 'kcal',
  timezone: typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Europe/Madrid',
  weight_loss_experience: null,
  past_diets: [],
  food_relationship: null,
  eating_triggers: [],
  emotional_eating_frequency: null,
  biggest_challenges: [],
  meals_per_day: null,
  snacking_frequency: null,
  cooking_frequency: null,
  eats_out_frequency: null,
  water_intake: null,
  sleep_quality: null,
  stress_level: null,
  diet_restrictions: [],
  allergies: [],
  secondary_goals: [],
  commitment_time: null,
  progress_tracking: [],
  living_situation: null,
  household_support: null,
  ai_tone_preference: null,
  wants_daily_tips: true,
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentScreen: 'welcome',
      data: initialData,
      isSubmitting: false,
      submitError: null,

      nextScreen: () =>
        set((state) => {
          const sequence = getScreenSequence(state.data)
          const currentIndex = sequence.indexOf(state.currentScreen)
          const nextIndex = Math.min(sequence.length - 1, currentIndex + 1)
          return { currentScreen: sequence[nextIndex] }
        }),

      prevScreen: () =>
        set((state) => {
          const sequence = getScreenSequence(state.data)
          const currentIndex = sequence.indexOf(state.currentScreen)
          const prevIndex = Math.max(0, currentIndex - 1)
          return { currentScreen: sequence[prevIndex] }
        }),

      goToScreen: (screen) => set({ currentScreen: screen }),

      updateData: (updates) =>
        set((state) => ({
          data: { ...state.data, ...updates },
        })),

      setSubmitting: (isSubmitting) => set({ isSubmitting }),
      setSubmitError: (submitError) => set({ submitError }),

      reset: () =>
        set({
          currentScreen: 'welcome',
          data: initialData,
          isSubmitting: false,
          submitError: null,
        }),
    }),
    { name: 'nutria-onboarding' },
  ),
)
