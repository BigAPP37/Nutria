// src/features/tdee/useTdeeState.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";
import { getCalorieGoal } from "@/features/tdee/algorithm";
import type { TdeeDisplayState } from "@/types/tdee";

export function useTdeeState() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.tdeeState(),
    queryFn: async (): Promise<TdeeDisplayState> => {
      const [tdeeRes, profileRes] = await Promise.all([
        supabase.from("user_tdee_state").select("*").eq("user_id", userId!).single(),
        supabase.from("user_profiles").select("goal,biological_sex").eq("id", userId!).single(),
      ]);
      if (tdeeRes.error) throw tdeeRes.error;
      if (profileRes.error) throw profileRes.error;

      const confidenceLevel = Number(tdeeRes.data.confidence_level ?? 0.3);
      const persistedTdee = Number(tdeeRes.data.tdee ?? tdeeRes.data.current_tdee_kcal ?? 0);
      const fallbackGoal = getCalorieGoal(
        persistedTdee,
        profileRes.data.goal,
        profileRes.data.biological_sex,
        confidenceLevel
      );

      return {
        goal_kcal: Number(tdeeRes.data.goal_kcal ?? fallbackGoal.goal_kcal),
        confidence_level: confidenceLevel,
        confidence_label: fallbackGoal.confidence_label,
        weeks_of_data: Number(tdeeRes.data.weeks_of_data ?? 0),
        last_adjusted: tdeeRes.data.last_adjusted ?? tdeeRes.data.last_adjusted_at ?? tdeeRes.data.updated_at,
        macro_targets: {
          protein_g: Number(tdeeRes.data.protein_g ?? tdeeRes.data.macro_protein_g ?? fallbackGoal.protein_g),
          carbs_g: Number(tdeeRes.data.carbs_g ?? tdeeRes.data.macro_carbs_g ?? fallbackGoal.carbs_g),
          fat_g: Number(tdeeRes.data.fat_g ?? tdeeRes.data.macro_fat_g ?? fallbackGoal.fat_g),
        },
      };
    },
    enabled: !!userId, staleTime: 1000*60*60,
  });
}
