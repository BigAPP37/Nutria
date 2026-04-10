// src/features/tdee/algorithm.ts
// Re-export de las funciones puras del algoritmo TDEE.
// El algoritmo completo está en supabase/functions/tdee-update/algorithm.ts
// Aquí solo exponemos calculateInitialTdee y getCalorieGoal para uso en el cliente.

export type BiologicalSex = "male" | "female";
export type ActivityLevel = "sedentary"|"lightly_active"|"moderately_active"|"very_active"|"extra_active";
export type UserGoal = "lose_weight"|"maintain"|"gain_muscle";

const MULTIPLIERS: Record<ActivityLevel, number> = { sedentary:1.2,lightly_active:1.375,moderately_active:1.55,very_active:1.725,extra_active:1.9 };
const MACROS: Record<UserGoal, {protein:number;carbs:number;fat:number}> = { lose_weight:{protein:0.30,carbs:0.40,fat:0.30}, maintain:{protein:0.25,carbs:0.45,fat:0.30}, gain_muscle:{protein:0.35,carbs:0.45,fat:0.20} };
const OFFSETS: Record<UserGoal, number> = { lose_weight:-500, maintain:0, gain_muscle:250 };

export function calculateAge(dob: string): number {
  const d = new Date(dob), now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

export function calculateBmr(wKg: number, hCm: number, age: number, sex: BiologicalSex): number {
  const base = 10*wKg + 6.25*hCm - 5*age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export interface CalorieGoal { tdee_kcal:number; goal_kcal:number; deficit_or_surplus:number; protein_g:number; carbs_g:number; fat_g:number; confidence_level:number; confidence_label:string; }

export function getConfidenceLabel(l: number): string {
  if (l<0.3) return "Estimación inicial, aún aprendiendo";
  if (l<0.6) return "Estimación en progreso";
  if (l<0.8) return "Estimación bastante precisa";
  return "Estimación muy precisa";
}

export function getCalorieGoal(tdee: number, goal: UserGoal, sex: BiologicalSex, conf: number): CalorieGoal {
  const minKcal = sex==="male"?1500:1200;
  const gk = Math.max(Math.round(tdee + OFFSETS[goal]), minKcal);
  const r = MACROS[goal];
  return { tdee_kcal:tdee, goal_kcal:gk, deficit_or_surplus:gk-tdee, protein_g:Math.round(gk*r.protein/4), carbs_g:Math.round(gk*r.carbs/4), fat_g:Math.round(gk*r.fat/9), confidence_level:conf, confidence_label:getConfidenceLabel(conf) };
}

export function calculateInitialTdee(profile: { biological_sex:BiologicalSex; date_of_birth:string; height_cm:number; activity_level:ActivityLevel; goal:UserGoal }, wKg: number) {
  const age = calculateAge(profile.date_of_birth);
  const bmr = calculateBmr(wKg, profile.height_cm, age, profile.biological_sex);
  const tdee = Math.round(bmr * MULTIPLIERS[profile.activity_level]);
  const safeTdee = Math.max(profile.biological_sex==="male"?1500:1200, Math.min(5000, tdee));
  return { bmr, tdee: safeTdee, calorie_goal: getCalorieGoal(safeTdee, profile.goal, profile.biological_sex, 0.3) };
}
