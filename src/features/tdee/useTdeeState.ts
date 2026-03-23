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
      const g = getCalorieGoal(Number(tdeeRes.data.current_tdee_kcal), profileRes.data.goal, profileRes.data.biological_sex, Number(tdeeRes.data.confidence_level));
      return { goal_kcal:g.goal_kcal, confidence_level:g.confidence_level, confidence_label:g.confidence_label, weeks_of_data:Number(tdeeRes.data.weeks_of_data), last_adjusted:tdeeRes.data.last_adjusted_at, macro_targets:{protein_g:g.protein_g,carbs_g:g.carbs_g,fat_g:g.fat_g} };
    },
    enabled: !!userId, staleTime: 1000*60*60,
  });
}
