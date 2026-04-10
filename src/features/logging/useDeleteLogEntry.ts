// src/features/logging/useDeleteLogEntry.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useUiStore } from "@/stores/uiStore";

export function useDeleteLogEntry() {
  const qc = useQueryClient();
  const selectedDate = useUiStore((s) => s.selectedDate);
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.from("food_log_entries").update({ deleted_at: new Date().toISOString() }).eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dailyLog(selectedDate) });
    },
  });
}
