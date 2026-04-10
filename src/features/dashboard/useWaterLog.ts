// src/features/dashboard/useWaterLog.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";

interface WaterLogRow {
  amount_ml: number | string | null;
}

async function fetchWater(userId: string, date: string) {
  const { data, error } = await supabase
    .from("water_log")
    .select("amount_ml")
    .eq("user_id", userId)
    .eq("log_date", date);
  if (error) throw error;
  const total = ((data ?? []) as WaterLogRow[]).reduce(
    (sum, row) => sum + Number(row.amount_ml ?? 0),
    0
  );
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

export function useRemoveWater() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({ date, ml }: { date: string; ml: number }) => {
      const { data, error } = await supabase
        .from("water_log")
        .select("id, amount_ml")
        .eq("user_id", userId!)
        .eq("log_date", date)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

      if (Number(data.amount_ml) <= ml) {
        const { error: deleteError } = await supabase
          .from("water_log")
          .delete()
          .eq("id", data.id);

        if (deleteError) throw deleteError;
        return;
      }

      const { error: updateError } = await supabase
        .from("water_log")
        .update({ amount_ml: Number(data.amount_ml) - ml })
        .eq("id", data.id);

      if (updateError) throw updateError;
    },
    onSuccess: (_, { date }) => {
      qc.invalidateQueries({ queryKey: queryKeys.waterLog(date) });
    },
  });
}
