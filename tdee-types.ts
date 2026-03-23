// =============================================================================
// NUTRIA — Tipos TypeScript para React Native (TDEE & Objetivos)
// Importar en la app: import type { ... } from '@/types/tdee'
// =============================================================================

// ---- Lo que la app muestra al usuario ----

export interface CalorieGoal {
  tdee_kcal: number;          // NO se muestra directamente al usuario
  goal_kcal: number;          // "Tu objetivo diario: 1,800 kcal"
  deficit_or_surplus: number;  // -500 (déficit) / 0 / +250 (superávit)
  protein_g: number;           // "Proteína: 135g"
  carbs_g: number;             // "Carbos: 203g"
  fat_g: number;               // "Grasa: 60g"
  confidence_level: number;    // 0.0 – 1.0
  confidence_label: string;    // "Estimación bastante precisa"
}

// ---- Estado del TDEE (para la pantalla de ajustes/stats) ----

export interface TdeeDisplayState {
  goal_kcal: number;
  confidence_level: number;
  confidence_label: string;
  weeks_of_data: number;
  last_adjusted: string;        // fecha legible
  macro_targets: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

// ---- Snapshot semanal (para gráfico de progreso) ----

export interface WeeklySnapshotDisplay {
  week_label: string;           // "11–17 Mar"
  avg_weight_kg: number | null;
  weight_delta_kg: number | null;
  avg_calories_day: number | null;
  complete_days: number;
  was_adjusted: boolean;
  adjustment_kcal: number;
  tdee_after: number;
}

// ---- Resumen de progreso (pantalla de estadísticas) ----

export interface ProgressSummary {
  current_weight_kg: number;
  start_weight_kg: number;
  weight_change_kg: number;      // negativo = perdió peso
  weeks_tracked: number;
  avg_adherence_pct: number;     // % de días completos logueados
  tdee_trend: 'stable' | 'increasing' | 'decreasing';
  weekly_snapshots: WeeklySnapshotDisplay[];
  calorie_goal: CalorieGoal;
}

// ---- Respuesta del endpoint /tdee-update ----

export interface TdeeUpdateResponse {
  success: boolean;
  result?: {
    was_adjusted: boolean;
    reason: string;
    new_tdee?: number;
  };
  // Modo cron (sin user_id):
  week?: string;
  processed?: number;
  adjusted?: number;
  skipped?: number;
  error?: string;
}
