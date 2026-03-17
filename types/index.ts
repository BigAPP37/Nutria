export interface Profile {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  height_cm: number;
  goal: "cut" | "maintain" | "bulk" | "recomp";
  diet_type: string;
  activity_level: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  tdee_estimated: number;
  created_at: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  logged_at: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  raw_input: string;
  parsed_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  confidence: number;
  source: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  logged_at: string;
  weight_kg: number;
  body_fat_pct?: number;
}

export interface FastingSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  target_hours: number;
  completed: boolean;
}

export interface DayTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface ParsedMeal {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  confidence: number;
  notes?: string;
}
