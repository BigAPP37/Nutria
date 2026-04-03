// Tipos de base de datos para Nutria
// Estos tipos reflejan la estructura de las tablas en Supabase

export type UserGoal = 'lose_weight' | 'maintain' | 'gain_muscle'
export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active'
export type BiologicalSex = 'male' | 'female'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type LoggingMethod = 'photo' | 'natural_text' | 'manual' | 'barcode'

// Perfil del usuario con preferencias y objetivos
export interface UserProfile {
  id: string
  display_name: string
  height_cm: number
  date_of_birth: string // ISO date YYYY-MM-DD
  biological_sex: BiologicalSex
  goal: UserGoal
  activity_level: ActivityLevel
  onboarding_completed: boolean
  country_code: string | null
  unit_weight: 'kg' | 'lb'
  unit_energy: 'kcal' | 'kJ'
  timezone: string
  created_at: string
  updated_at: string
}

// Registro de peso corporal
export interface WeightEntry {
  id: string
  user_id: string
  weight_kg: number
  notes: string | null
  recorded_at: string // ISO datetime
}

// Entrada en el diario de comidas
export interface FoodLogEntry {
  id: string
  user_id: string
  food_id: string | null
  log_date: string // ISO date YYYY-MM-DD
  meal_type: MealType
  logging_method: LoggingMethod
  calories_kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number | null
  quantity_grams: number
  custom_description: string | null
  deleted_at: string | null
}

// Base de datos de alimentos
export interface Food {
  id: string
  name: string
  brand: string | null
  category: string | null
  calories_kcal: number   // por 100g
  protein_g: number       // por 100g
  carbs_g: number         // por 100g
  fat_g: number           // por 100g
  fiber_g: number | null  // por 100g
  is_active: boolean
}

// Estado diario del log (resumen del día)
export interface DailyLogStatus {
  id: string
  user_id: string
  log_date: string // ISO date YYYY-MM-DD
  is_day_complete: boolean
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  meal_count: number
  created_at: string
  updated_at: string
}

// Registro de agua
export interface WaterLog {
  id: string
  user_id: string
  amount_ml: number
  log_date: string // ISO date YYYY-MM-DD
}

// Tipo para insertar un nuevo perfil (sin campos autogenerados)
export type UserProfileInsert = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>

// Tipo para insertar una entrada de peso
export type WeightEntryInsert = Omit<WeightEntry, 'id'>

// Tipo para insertar una entrada de comida
export type FoodLogEntryInsert = Omit<FoodLogEntry, 'id'>

// Porción predefinida de un alimento (e.g. "1 huevo", "1 rebanada")
export interface FoodServing {
  id: string
  food_id: string
  label: string   // e.g. "1 unidad", "1 rebanada"
  grams: number   // peso en gramos de esa porción
}
