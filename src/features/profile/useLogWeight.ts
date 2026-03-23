// src/features/profile/useLogWeight.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";

export function useLogWeight() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async (weightKg: number) => {
      const { error } = await supabase.from("weight_entries").insert({ user_id: userId!, weight_kg: weightKg });
      if (error) throw error;
      await supabase.functions.invoke("tdee-update", { body: { user_id: userId } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.weightHistory() });
      qc.invalidateQueries({ queryKey: queryKeys.tdeeState() });
    },
  });
}
