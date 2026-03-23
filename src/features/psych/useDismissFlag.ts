// src/features/psych/useDismissFlag.ts
// Mutations para registrar dismiss y feedback de mensajes psicológicos.
// dismissFlag: inserta en psychological_responses con dismissed_at.
// markHelpful: actualiza was_helpful en la respuesta existente.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";

/**
 * Mutation para dismissar un flag psicológico.
 * Inserta un registro en psychological_responses con dismissed_at = now().
 * Retorna el response_id para poder hacer markHelpful después.
 */
export function useDismissFlag() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      flagId,
      messageKey,
      messageContent,
    }: {
      flagId: string;
      messageKey: string;
      messageContent: string;
    }): Promise<string> => {
      if (!userId) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("psychological_responses")
        .insert({
          user_id: userId,
          flag_id: flagId,
          message_key: messageKey,
          message_content: messageContent,
          shown_at: new Date().toISOString(),
          dismissed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.psychFlags() });
    },

    // Fallar silenciosamente — no mostrar error al usuario por esto
    onError: (err) => {
      console.error("Error dismissing psych flag:", err);
    },
  });
}

/**
 * Mutation para registrar feedback de utilidad.
 * Actualiza was_helpful en el registro de psychological_responses.
 */
export function useMarkHelpful() {
  return useMutation({
    mutationFn: async ({
      responseId,
      helpful,
    }: {
      responseId: string;
      helpful: boolean;
    }) => {
      const { error } = await supabase
        .from("psychological_responses")
        .update({ was_helpful: helpful })
        .eq("id", responseId);

      if (error) throw error;
    },

    // Silencioso — es feedback opcional
    onError: (err) => {
      console.error("Error recording psych feedback:", err);
    },
  });
}
