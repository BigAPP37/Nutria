// src/features/dashboard/useMarkDayComplete.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";

export function useMarkDayComplete() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async ({ date, totals }: { date: string; totals: { calories: number; protein: number; carbs: number; fat: number } }) => {
      const { error } = await supabase.from("daily_log_status").upsert({ user_id: userId!, log_date: date, is_day_complete: true, total_calories: totals.calories, total_protein_g: totals.protein, total_carbs_g: totals.carbs, total_fat_g: totals.fat });
      if (error) throw error;
    },
    onSuccess: (_, { date }) => { qc.invalidateQueries({ queryKey: queryKeys.dailyLog(date) }); },
  });
}
