// src/features/logging/useDeleteLogEntry.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";

export function useDeleteLogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.from("food_log_entries").update({ deleted_at: new Date().toISOString() }).eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      const today = new Date().toISOString().split("T")[0];
      qc.invalidateQueries({ queryKey: queryKeys.dailyLog(today) });
    },
  });
}
