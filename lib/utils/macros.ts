import { Profile } from "@/types";

export function calculateTargets(profile: {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: string;
  activity_level: string;
  goal: string;
}): { calories: number; protein: number; carbs: number; fat: number } {
  // Harris-Benedict
  let bmr =
    profile.gender === "male"
      ? 88.362 + 13.397 * profile.weight_kg + 4.799 * profile.height_cm - 5.677 * profile.age
      : 447.593 + 9.247 * profile.weight_kg + 3.098 * profile.height_cm - 4.33 * profile.age;

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdee = bmr * (activityMultipliers[profile.activity_level] || 1.55);

  const goalAdjustments: Record<string, number> = {
    cut: -500,
    maintain: 0,
    bulk: 300,
    recomp: -200,
  };

  const calories = Math.round(tdee + (goalAdjustments[profile.goal] || 0));
  const protein = Math.round(profile.weight_kg * 2.2);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

  return { calories, protein, carbs, fat };
}

export function getMealTypeByHour(hour: number): string {
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 19) return "snack";
  return "dinner";
}

export function getProgressColor(pct: number): string {
  if (pct < 0.6) return "#22c55e";
  if (pct < 0.9) return "#f59e0b";
  if (pct <= 1.0) return "#3b82f6";
  return "#ef4444";
}
