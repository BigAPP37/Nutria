// src/features/logging/useAiLog.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useLogSessionStore } from "@/stores/logSessionStore";
import type { AiLogRequest, AiLogResponse } from "@/types/ai-log";

export function useAiLog() {
  const qc = useQueryClient();
  const { setAiResult, setStep, setError } = useLogSessionStore();
  return useMutation({
    mutationFn: async (request: AiLogRequest): Promise<AiLogResponse> => {
      const { data, error } = await supabase.functions.invoke("ai-log", { body: request });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Error en análisis IA");
      return data as AiLogResponse;
    },
    onMutate: () => { setStep("analyzing"); },
    onSuccess: (data) => {
      setAiResult(data);
      const today = new Date().toISOString().split("T")[0];
      qc.invalidateQueries({ queryKey: queryKeys.dailyLog(today) });
    },
    onError: (error: Error) => { setError(error.message); },
  });
}
