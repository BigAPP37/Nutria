// src/features/dashboard/useWaterLog.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";

async function fetchWater(userId: string, date: string) {
  const { data, error } = await supabase.from("water_log").select("amount_ml").eq("user_id", userId).eq("log_date", date);
  if (error) throw error;
  const total = (data ?? []).reduce((s: number, r: any) => s + Number(r.amount_ml), 0);
  return { amount_ml: total };
}

export function useWaterLog(date: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: queryKeys.waterLog(date), queryFn: () => fetchWater(userId!, date), enabled: !!userId, staleTime: 1000*60 });
}

export function useAddWater() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async ({ date, ml }: { date: string; ml: number }) => {
      const { error } = await supabase.from("water_log").insert({ user_id: userId!, log_date: date, amount_ml: ml });
      if (error) throw error;
    },
    onSuccess: (_, { date }) => { qc.invalidateQueries({ queryKey: queryKeys.waterLog(date) }); },
  });
}
