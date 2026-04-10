// src/features/onboarding/submitOnboarding.ts
// Usa la misma RPC atómica que la web para que ambas plataformas escriban
// exactamente la misma forma de datos en user_profiles, user_context y user_tdee_state.

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { calculateInitialTdee } from "@/features/tdee/algorithm";
import type { OnboardingState, TcaScreeningAnswer } from "@/stores/onboardingStore";

type WebTcaAnswer = "yes" | "no" | "prefer_not_to_say" | null;

function mapTcaAnswer(answer: TcaScreeningAnswer | null): WebTcaAnswer {
  if (!answer) return null;
  if (answer === "prefer_not_to_say") return "prefer_not_to_say";
  if (answer === "complicated") return "yes";
  return "no";
}

function isTcaFlagged(answer: TcaScreeningAnswer | null) {
  return answer === "complicated";
}

export async function submitOnboarding(
  data: OnboardingState
): Promise<void> {
  if (
    !data.weightKg ||
    !data.heightCm ||
    !data.dateOfBirth ||
    !data.biologicalSex ||
    !data.goal ||
    !data.activityLevel
  ) {
    throw new Error("Faltan datos obligatorios del onboarding");
  }

  const weightKg = data.weightKg;
  const heightCm = data.heightCm;
  const { tdee, calorie_goal } = calculateInitialTdee(
    {
      biological_sex: data.biologicalSex,
      date_of_birth: data.dateOfBirth,
      height_cm: heightCm,
      activity_level: data.activityLevel,
      goal: data.goal,
    },
    weightKg
  );

  const tcaAnswer = mapTcaAnswer(data.tcaScreening);

  const { error: onboardingError } = await supabase.rpc("complete_onboarding_atomic", {
    p_display_name: data.displayName || "Usuario",
    p_height_cm: heightCm,
    p_date_of_birth: data.dateOfBirth,
    p_biological_sex: data.biologicalSex,
    p_goal: data.goal,
    p_activity_level: data.activityLevel,
    p_country_code: data.countryCode,
    p_unit_weight: data.unitWeight,
    p_unit_energy: data.unitEnergy,
    p_timezone: data.timezone,
    p_weight_kg: weightKg,
    p_weight_loss_experience: null,
    p_past_diets: null,
    p_biggest_challenges: null,
    p_eating_triggers: null,
    p_emotional_eating_frequency: null,
    p_food_relationship: null,
    p_meals_per_day: null,
    p_snacking_frequency: null,
    p_cooking_frequency: null,
    p_eats_out_frequency: null,
    p_water_intake: null,
    p_sleep_quality: null,
    p_stress_level: null,
    p_diet_restrictions: null,
    p_allergies: null,
    p_secondary_goals: null,
    p_commitment_time: null,
    p_progress_tracking: null,
    p_living_situation: null,
    p_household_support: null,
    p_ai_tone_preference: null,
    p_wants_daily_tips: true,
    p_tca_answer: tcaAnswer,
    p_tca_flagged: isTcaFlagged(data.tcaScreening),
    p_tdee: tdee,
    p_goal_kcal: calorie_goal.goal_kcal,
    p_protein_g: calorie_goal.protein_g,
    p_carbs_g: calorie_goal.carbs_g,
    p_fat_g: calorie_goal.fat_g,
  });

  if (onboardingError) {
    throw new Error(`Error guardando onboarding: ${onboardingError.message}`);
  }

  useAuthStore.getState().setOnboardingCompleted(true);
}
