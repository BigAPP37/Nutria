// src/features/tdee/useWeeklySnapshots.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";
import type { WeeklySnapshotDisplay } from "@/types/tdee";

interface WeeklySnapshotRow {
  week_start: string;
  week_end: string;
  avg_weight_kg: number | string | null;
  weight_delta_kg: number | string | null;
  avg_calories_day: number | string | null;
  complete_days: number;
  adjustment_kcal: number | string;
  tdee_after_adjustment: number | string;
}

export function useWeeklySnapshots() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.weeklySnapshots(),
    queryFn: async (): Promise<WeeklySnapshotDisplay[]> => {
      const { data, error } = await supabase.from("tdee_weekly_snapshots").select("*").eq("user_id", userId!).order("week_start", { ascending: false }).limit(12);
      if (error) throw error;
      return ((data ?? []) as WeeklySnapshotRow[]).map((s) => {
        const ws = new Date(s.week_start), we = new Date(s.week_end);
        const m = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
        return { week_label: `${ws.getDate()}–${we.getDate()} ${m[we.getMonth()]}`, avg_weight_kg: s.avg_weight_kg?Number(s.avg_weight_kg):null, weight_delta_kg: s.weight_delta_kg?Number(s.weight_delta_kg):null, avg_calories_day: s.avg_calories_day?Number(s.avg_calories_day):null, complete_days: s.complete_days, was_adjusted: s.adjustment_kcal!==0, adjustment_kcal: Number(s.adjustment_kcal), tdee_after: Number(s.tdee_after_adjustment) };
      });
    },
    enabled: !!userId, staleTime: 1000*60*60,
  });
}
