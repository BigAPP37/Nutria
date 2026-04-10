// Cálculos de TDEE y macros - funciones puras, sin llamadas de red
// Basadas en la fórmula de Mifflin-St Jeor

import type { ActivityLevel, UserGoal, BiologicalSex } from '@/types/database'

// Multiplicadores de actividad física
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
}

// Distribución de macros por objetivo (en porcentaje de calorías)
const MACRO_DISTRIBUTION: Record<
  UserGoal,
  { protein: number; carbs: number; fat: number }
> = {
  lose_weight: { protein: 0.30, carbs: 0.40, fat: 0.30 },
  maintain: { protein: 0.25, carbs: 0.45, fat: 0.30 },
  gain_muscle: { protein: 0.35, carbs: 0.45, fat: 0.20 },
}

// Calcular edad en años a partir de fecha de nacimiento
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Calcular BMR usando la fórmula de Mifflin-St Jeor
export function calculateBMR(params: {
  weight_kg: number
  height_cm: number
  birth_date: string
  biological_sex: BiologicalSex
}): number {
  const { weight_kg, height_cm, birth_date, biological_sex } = params
  const age = calculateAge(birth_date)

  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age

  if (biological_sex === 'male') {
    return base + 5
  } else {
    return base - 161
  }
}

// Calcular TDEE (Total Daily Energy Expenditure)
export function calculateTDEE(params: {
  weight_kg: number
  height_cm: number
  birth_date: string
  biological_sex: BiologicalSex
  activity_level: ActivityLevel
}): number {
  const bmr = calculateBMR(params)
  const multiplier = ACTIVITY_MULTIPLIERS[params.activity_level]
  return Math.round(bmr * multiplier)
}

// Calcular objetivo calórico según la meta del usuario
export function calculateCalorieGoal(
  tdee: number,
  goal: UserGoal,
  biological_sex: BiologicalSex
): number {
  const minimumCalories = biological_sex === 'male' ? 1500 : 1200

  switch (goal) {
    case 'lose_weight':
      return Math.max(minimumCalories, tdee - 500)
    case 'maintain':
      return tdee
    case 'gain_muscle':
      return tdee + 250
  }
}

// Calcular macros en gramos a partir del objetivo calórico
export function calculateMacros(
  calorieGoal: number,
  goal: UserGoal
): { protein_g: number; carbs_g: number; fat_g: number } {
  const dist = MACRO_DISTRIBUTION[goal]

  // 4 kcal/g para proteína y carbohidratos, 9 kcal/g para grasa
  const protein_g = Math.round((calorieGoal * dist.protein) / 4)
  const carbs_g = Math.round((calorieGoal * dist.carbs) / 4)
  const fat_g = Math.round((calorieGoal * dist.fat) / 9)

  return { protein_g, carbs_g, fat_g }
}

// Función principal: calcular todos los valores nutricionales del usuario
export function calculateNutritionGoals(params: {
  weight_kg: number
  height_cm: number
  birth_date: string
  biological_sex: BiologicalSex
  activity_level: ActivityLevel
  goal: UserGoal
}): {
  tdee: number
  calorie_goal: number
  protein_g: number
  carbs_g: number
  fat_g: number
} {
  const tdee = calculateTDEE(params)
  const calorie_goal = calculateCalorieGoal(tdee, params.goal, params.biological_sex)
  const macros = calculateMacros(calorie_goal, params.goal)

  return {
    tdee,
    calorie_goal,
    ...macros,
  }
}

// Convertir libras a kilogramos
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10
}

// Convertir kilogramos a libras
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10
}

// Convertir pies+pulgadas a centímetros
export function ftInToCm(feet: number, inches: number): number {
  return Math.round((feet * 30.48 + inches * 2.54) * 10) / 10
}

// Convertir centímetros a pies e pulgadas
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return { feet, inches }
}

// Calcular porcentaje de progreso (0-100)
export function calculateProgress(current: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(100, Math.round((current / goal) * 100))
}
