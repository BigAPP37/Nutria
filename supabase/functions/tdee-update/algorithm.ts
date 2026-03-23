// =============================================================================
// NUTRIA — Algoritmo TDEE Adaptativo: Lógica Pura
// Sin dependencias externas. Todas las funciones son puras y testeables.
// =============================================================================

// =============================================================================
// TIPOS
// =============================================================================

export type BiologicalSex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";
export type UserGoal = "lose_weight" | "maintain" | "gain_muscle";

export interface UserProfile {
  biological_sex: BiologicalSex;
  date_of_birth: string; // ISO date
  height_cm: number;
  activity_level: ActivityLevel;
  goal: UserGoal;
}

export interface TdeeState {
  current_tdee_kcal: number;
  current_bmr_kcal: number;
  initial_tdee_kcal: number;
  confidence_level: number; // 0.0 – 1.0
  weeks_of_data: number;
  last_adjusted_at: string;
}

export interface WeeklyData {
  complete_days: number;
  avg_calories_day: number;
  avg_weight_kg: number;
  weight_start: number | null;
  weight_end: number | null;
}

export interface WeeklySnapshot {
  user_id: string;
  week_start: string;
  week_end: string;
  avg_weight_kg: number | null;
  weight_delta_kg: number | null;
  avg_calories_day: number | null;
  complete_days: number;
  total_days: number;
  expected_weight_delta_kg: number | null;
  tdee_before_adjustment: number;
  tdee_after_adjustment: number;
  adjustment_kcal: number;
  adjustment_reason: string;
}

export interface CalorieGoal {
  tdee_kcal: number;
  goal_kcal: number;
  deficit_or_surplus: number; // negativo = déficit, positivo = superávit
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence_level: number;
  confidence_label: string;
}

export interface AdjustmentResult {
  new_tdee: number;
  adjustment_kcal: number;
  new_confidence: number;
  reason: string;
  snapshot: Omit<WeeklySnapshot, "user_id">;
  was_adjusted: boolean; // false si hubo anomalía o datos insuficientes
}

// =============================================================================
// CONSTANTES
// =============================================================================

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

// Límites de seguridad
const TDEE_MIN_FEMALE = 1200;
const TDEE_MIN_MALE = 1500;
const TDEE_MAX = 5000;
const MAX_WEEKLY_CHANGE = 300; // kcal

// Umbrales de anomalía
const MIN_COMPLETE_DAYS = 4;
const MIN_WEIGHT_ENTRIES = 2; // start + end
const MAX_WEIGHT_DELTA_KG = 2.0;
const MIN_AVG_CALORIES = 800;
const MAX_AVG_CALORIES = 5000;

// Constante energética: kcal por kg de tejido
const KCAL_PER_KG = 7700;

// Macros por objetivo (% de calorías)
const MACRO_RATIOS: Record<UserGoal, { protein: number; carbs: number; fat: number }> = {
  lose_weight: { protein: 0.30, carbs: 0.40, fat: 0.30 },
  maintain: { protein: 0.25, carbs: 0.45, fat: 0.30 },
  gain_muscle: { protein: 0.35, carbs: 0.45, fat: 0.20 },
};

// Déficit/superávit por objetivo
const GOAL_OFFSETS: Record<UserGoal, number> = {
  lose_weight: -500,
  maintain: 0,
  gain_muscle: 250,
};

// =============================================================================
// 1. CÁLCULO INICIAL (Mifflin-St Jeor)
// =============================================================================

/**
 * Calcula la edad en años a partir de la fecha de nacimiento.
 */
export function calculateAge(dateOfBirth: string, referenceDate?: string): number {
  const dob = new Date(dateOfBirth);
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  let age = ref.getFullYear() - dob.getFullYear();
  const monthDiff = ref.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Calcula BMR usando Mifflin-St Jeor.
 * Hombre: (10 × peso_kg) + (6.25 × altura_cm) – (5 × edad) + 5
 * Mujer:  (10 × peso_kg) + (6.25 × altura_cm) – (5 × edad) – 161
 */
export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: BiologicalSex
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

/**
 * Calcula el TDEE inicial a partir del perfil del usuario.
 * Se usa en onboarding (sin datos reales todavía).
 */
export function calculateInitialTdee(
  profile: UserProfile,
  currentWeightKg: number
): { bmr: number; tdee: number; calorie_goal: CalorieGoal } {
  const age = calculateAge(profile.date_of_birth);
  const bmr = calculateBmr(currentWeightKg, profile.height_cm, age, profile.biological_sex);
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activity_level];
  const tdee = Math.round(bmr * multiplier);

  // Aplicar límites de seguridad al TDEE
  const safeTdee = clampTdee(tdee, profile.biological_sex);

  return {
    bmr,
    tdee: safeTdee,
    calorie_goal: getCalorieGoal(safeTdee, profile.goal, profile.biological_sex, 0.3),
  };
}

// =============================================================================
// 2. OBJETIVO CALÓRICO + MACROS
// =============================================================================

/**
 * Calcula el objetivo calórico diario y el desglose de macros.
 * El TDEE es lo que el cuerpo quema. El objetivo es lo que el usuario DEBE comer.
 */
export function getCalorieGoal(
  tdee: number,
  goal: UserGoal,
  sex: BiologicalSex,
  confidenceLevel: number
): CalorieGoal {
  const offset = GOAL_OFFSETS[goal];
  let goalKcal = Math.round(tdee + offset);

  // El objetivo calórico tampoco puede bajar del mínimo de seguridad
  const minKcal = sex === "male" ? TDEE_MIN_MALE : TDEE_MIN_FEMALE;
  goalKcal = Math.max(goalKcal, minKcal);

  const ratios = MACRO_RATIOS[goal];

  return {
    tdee_kcal: tdee,
    goal_kcal: goalKcal,
    deficit_or_surplus: goalKcal - tdee,
    protein_g: Math.round((goalKcal * ratios.protein) / 4),
    carbs_g: Math.round((goalKcal * ratios.carbs) / 4),
    fat_g: Math.round((goalKcal * ratios.fat) / 9),
    confidence_level: confidenceLevel,
    confidence_label: getConfidenceLabel(confidenceLevel),
  };
}

/**
 * Etiqueta legible del nivel de confianza (en español).
 */
export function getConfidenceLabel(level: number): string {
  if (level < 0.3) return "Estimación inicial, aún aprendiendo";
  if (level < 0.6) return "Estimación en progreso";
  if (level < 0.8) return "Estimación bastante precisa";
  return "Estimación muy precisa";
}

// =============================================================================
// 3. AJUSTE SEMANAL — el corazón del algoritmo
// =============================================================================

/**
 * Ejecuta el ajuste semanal del TDEE.
 *
 * Principio: TDEE_real = Calorías_consumidas - (ΔPeso × 7700 / 7)
 *
 * Si el usuario perdió peso comiendo X, su TDEE es MAYOR que X.
 * Si ganó peso comiendo X, su TDEE es MENOR que X.
 */
export function calculateWeeklyAdjustment(
  currentState: TdeeState,
  weeklyData: WeeklyData,
  sex: BiologicalSex,
  weekStart: string,
  weekEnd: string
): AdjustmentResult {
  const baseSnapshot = {
    week_start: weekStart,
    week_end: weekEnd,
    avg_weight_kg: weeklyData.avg_weight_kg || null,
    weight_delta_kg: null as number | null,
    avg_calories_day: weeklyData.avg_calories_day || null,
    complete_days: weeklyData.complete_days,
    total_days: 7,
    expected_weight_delta_kg: null as number | null,
    tdee_before_adjustment: currentState.current_tdee_kcal,
    tdee_after_adjustment: currentState.current_tdee_kcal,
    adjustment_kcal: 0,
    adjustment_reason: "",
  };

  // ---------------------------------------------------------------
  // Validación 1: Suficientes días completos de logging
  // ---------------------------------------------------------------
  if (weeklyData.complete_days < MIN_COMPLETE_DAYS) {
    return noAdjustment(
      currentState,
      baseSnapshot,
      `insufficient_data: solo ${weeklyData.complete_days} días completos (mínimo ${MIN_COMPLETE_DAYS})`,
      // Penalizar confianza ligeramente por falta de datos
      Math.max(currentState.confidence_level - 0.05, 0)
    );
  }

  // ---------------------------------------------------------------
  // Validación 2: Suficientes pesadas (inicio y fin de semana)
  // ---------------------------------------------------------------
  if (weeklyData.weight_start === null || weeklyData.weight_end === null) {
    return noAdjustment(
      currentState,
      baseSnapshot,
      "insufficient_data: faltan pesadas de inicio o fin de semana",
      Math.max(currentState.confidence_level - 0.05, 0)
    );
  }

  const weightDelta = round(weeklyData.weight_end - weeklyData.weight_start, 2);
  baseSnapshot.weight_delta_kg = weightDelta;

  // ---------------------------------------------------------------
  // Validación 3: Anomalía de peso (>2 kg en una semana)
  // ---------------------------------------------------------------
  if (Math.abs(weightDelta) > MAX_WEIGHT_DELTA_KG) {
    return noAdjustment(
      currentState,
      baseSnapshot,
      `anomaly_weight: delta de ${weightDelta} kg excede ±${MAX_WEIGHT_DELTA_KG} kg (probable retención de líquidos o error)`,
      currentState.confidence_level // no penalizar confianza por anomalía de peso
    );
  }

  // ---------------------------------------------------------------
  // Validación 4: Calorías promedio fuera de rango razonable
  // ---------------------------------------------------------------
  if (weeklyData.avg_calories_day < MIN_AVG_CALORIES) {
    return noAdjustment(
      currentState,
      baseSnapshot,
      `anomaly_calories: promedio de ${Math.round(weeklyData.avg_calories_day)} kcal/día es < ${MIN_AVG_CALORIES} (logging probablemente incompleto)`,
      currentState.confidence_level
    );
  }

  if (weeklyData.avg_calories_day > MAX_AVG_CALORIES) {
    return noAdjustment(
      currentState,
      baseSnapshot,
      `anomaly_calories: promedio de ${Math.round(weeklyData.avg_calories_day)} kcal/día es > ${MAX_AVG_CALORIES} (error de logging evidente)`,
      currentState.confidence_level
    );
  }

  // ---------------------------------------------------------------
  // Cálculo del TDEE real observado (CICO invertida)
  // ---------------------------------------------------------------
  // TDEE = calorías_consumidas - (delta_peso_kg × 7700 / 7)
  // Si perdió peso: delta negativo → restamos un negativo → TDEE > calorías (correcto)
  // Si ganó peso: delta positivo → restamos un positivo → TDEE < calorías (correcto)
  const dailyWeightChange = weightDelta * KCAL_PER_KG / 7;
  const tdeeObserved = Math.round(weeklyData.avg_calories_day - dailyWeightChange);

  // Calcular qué delta de peso se esperaría con el TDEE actual
  // expectedDelta = (calorías - TDEE_actual) × 7 / 7700
  const expectedDelta = round(
    ((weeklyData.avg_calories_day - currentState.current_tdee_kcal) * 7) / KCAL_PER_KG,
    2
  );
  baseSnapshot.expected_weight_delta_kg = expectedDelta;

  // ---------------------------------------------------------------
  // Suavizado exponencial (EMA)
  // alpha crece con las semanas de datos: más datos → más confianza en lo observado
  // Semana 1: alpha = 0.35 (confía 35% en datos, 65% en histórico)
  // Semana 8+: alpha = 0.70 (confía 70% en datos, 30% en histórico)
  // ---------------------------------------------------------------
  const weeksForAlpha = currentState.weeks_of_data + 1;
  const alpha = Math.min(0.30 + weeksForAlpha * 0.05, 0.70);
  let smoothedTdee = Math.round(
    alpha * tdeeObserved + (1 - alpha) * currentState.current_tdee_kcal
  );

  // ---------------------------------------------------------------
  // Limitar cambio máximo por semana a ±300 kcal
  // ---------------------------------------------------------------
  let rawChange = smoothedTdee - currentState.current_tdee_kcal;
  let wasClamped = false;

  if (Math.abs(rawChange) > MAX_WEEKLY_CHANGE) {
    wasClamped = true;
    rawChange = rawChange > 0 ? MAX_WEEKLY_CHANGE : -MAX_WEEKLY_CHANGE;
    smoothedTdee = currentState.current_tdee_kcal + rawChange;
  }

  // ---------------------------------------------------------------
  // Aplicar límites absolutos de TDEE
  // ---------------------------------------------------------------
  const finalTdee = clampTdee(smoothedTdee, sex);
  const finalChange = finalTdee - currentState.current_tdee_kcal;

  // ---------------------------------------------------------------
  // Actualizar confianza
  // Cada semana con datos completos sube la confianza
  // ---------------------------------------------------------------
  const newConfidence = Math.min(
    currentState.confidence_level + 0.08,
    0.95
  );

  // ---------------------------------------------------------------
  // Construir razón del ajuste
  // ---------------------------------------------------------------
  let reason = `adjusted: TDEE observado=${tdeeObserved}, alpha=${round(alpha, 2)}, suavizado=${smoothedTdee}`;
  if (wasClamped) {
    reason += ` | cambio limitado de ${Math.round(smoothedTdee - currentState.current_tdee_kcal + (rawChange - rawChange))} a ±${MAX_WEEKLY_CHANGE}`;
  }
  if (finalTdee !== smoothedTdee) {
    reason += ` | clamped a límites de seguridad (${finalTdee})`;
  }

  const snapshot: Omit<WeeklySnapshot, "user_id"> = {
    ...baseSnapshot,
    tdee_after_adjustment: finalTdee,
    adjustment_kcal: finalChange,
    adjustment_reason: reason,
  };

  return {
    new_tdee: finalTdee,
    adjustment_kcal: finalChange,
    new_confidence: round(newConfidence, 2),
    reason,
    snapshot,
    was_adjusted: true,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Aplica límites de seguridad al TDEE.
 */
export function clampTdee(tdee: number, sex: BiologicalSex): number {
  const min = sex === "male" ? TDEE_MIN_MALE : TDEE_MIN_FEMALE;
  return Math.max(min, Math.min(TDEE_MAX, Math.round(tdee)));
}

/**
 * Genera resultado de "no ajustar" con la razón dada.
 */
function noAdjustment(
  currentState: TdeeState,
  baseSnapshot: Omit<WeeklySnapshot, "user_id">,
  reason: string,
  newConfidence: number
): AdjustmentResult {
  return {
    new_tdee: currentState.current_tdee_kcal,
    adjustment_kcal: 0,
    new_confidence: round(newConfidence, 2),
    reason,
    snapshot: {
      ...baseSnapshot,
      tdee_after_adjustment: currentState.current_tdee_kcal,
      adjustment_kcal: 0,
      adjustment_reason: reason,
    },
    was_adjusted: false,
  };
}

function round(n: number, decimals = 1): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

// =============================================================================
// EXPORTS PARA CONSTANTES (útil en tests)
// =============================================================================

export const CONSTANTS = {
  ACTIVITY_MULTIPLIERS,
  TDEE_MIN_FEMALE,
  TDEE_MIN_MALE,
  TDEE_MAX,
  MAX_WEEKLY_CHANGE,
  MIN_COMPLETE_DAYS,
  MAX_WEIGHT_DELTA_KG,
  MIN_AVG_CALORIES,
  MAX_AVG_CALORIES,
  KCAL_PER_KG,
  MACRO_RATIOS,
  GOAL_OFFSETS,
};
