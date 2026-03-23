// src/features/profile/useWeightHistory.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";

export interface WeightPoint { date: string; weight_kg: number; }

export function useWeightHistory() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.weightHistory(),
    queryFn: async (): Promise<WeightPoint[]> => {
      const { data, error } = await supabase.from("weight_entries").select("weight_kg,recorded_at").eq("user_id", userId!).order("recorded_at", { ascending: true }).limit(90);
      if (error) throw error;
      return (data ?? []).map((w: any) => ({ date: w.recorded_at.split("T")[0], weight_kg: Number(w.weight_kg) }));
    },
    enabled: !!userId, staleTime: 1000*60*10,
  });
}
