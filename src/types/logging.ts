// Tipos para el flujo de registro de comida con IA

export interface AiLogRequest {
  method: 'photo' | 'text' | 'barcode'
  payload: string
  user_id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  country_code: string
  photo_storage_path?: string
  timezone: string
  log_date: string
}

export interface AiLogResponse {
  success: boolean
  plato_descripcion: string
  origen_cultural: string | null
  confianza_general: number
  alimentos: AlimentoDetectado[]
  totales: NutritionTotals
  ambiguedades?: string[]
  log_entry_ids: string[]
}

export interface AlimentoDetectado {
  nombre: string
  cantidad_gramos: number
  calorias_estimadas: number
  proteina_g: number
  carbohidratos_g: number
  grasa_g: number
  fibra_g: number
  confianza: number
  metodo_estimacion: 'db_match' | 'claude_estimate'
  db_food_id: string | null
  db_serving_id?: string | null
  notas: string | null
}

export interface NutritionTotals {
  calorias: number
  proteina_g: number
  carbohidratos_g: number
  grasa_g: number
  fibra_g: number
}

export interface FoodSearchResult {
  food_id: string
  food_name: string
  brand: string | null
  calories_kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  origin_country: string
  is_verified: boolean
}

// ── Tipos para la pantalla de Estadísticas ────────────────────────────────────

export interface TdeeDisplayState {
  goal_kcal: number
  confidence_level: number      // 0-1
  confidence_label: string
  weeks_of_data: number
  last_adjusted: string
  macro_targets: {
    protein_g: number
    carbs_g: number
    fat_g: number
  }
}

export interface WeeklySnapshotDisplay {
  week_label: string             // "11–17 Mar"
  week_start: string             // ISO date
  avg_weight_kg: number | null
  weight_delta_kg: number | null
  avg_calories_day: number | null
  complete_days: number
  was_adjusted: boolean
  adjustment_kcal: number
  tdee_after: number
}

export interface WeightPoint {
  recorded_at: string   // ISO datetime (columna recorded_at de la BD)
  weight_kg: number
}

export interface MacroAveragesData {
  avgCalories: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
  daysWithData: number
}
