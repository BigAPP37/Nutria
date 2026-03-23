// src/features/psych/usePsychFlags.ts
// Query que obtiene el flag psicológico activo más reciente del usuario.
// Solo retorna flags de los últimos 7 días que NO han sido dismissed.
// Máximo 1 flag a la vez — el más reciente.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";

// Mapeo de flag_type a contenido del mensaje
const MESSAGES: Record<string, { key: string; content: string }> = {
  consecutive_low_logging: {
    key: "low_intake_support",
    content:
      "Hemos notado que algunos días has registrado muy poco. " +
      "Nutria es una herramienta de apoyo, no de restricción. " +
      "Recuerda que comer bien es parte del objetivo. 💛",
  },
  consecutive_zero_logging: {
    key: "missing_logs_checkin",
    content:
      "Llevamos unos días sin saber de ti. No pasa nada — " +
      "a veces la vida se pone intensa. ¿Cómo estás? 🤍",
  },
  restrictive_language: {
    key: "restrictive_language_support",
    content:
      "Parece que estás teniendo un momento difícil con la comida. " +
      "Está bien pedir ayuda. Nutria puede ser más útil si " +
      "la usas a tu ritmo, sin presión. 💛",
  },
};

export interface ActivePsychFlag {
  id: string;
  flag_type: string;
  detected_at: string;
  message_key: string;
  message_content: string;
}

async function fetchActiveFlag(userId: string): Promise<ActivePsychFlag | null> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Obtener flags recientes
  const { data: flags, error } = await supabase
    .from("psychological_flags")
    .select("id, flag_type, detected_at")
    .eq("user_id", userId)
    .gte("detected_at", sevenDaysAgo.toISOString())
    .order("detected_at", { ascending: false })
    .limit(5);

  if (error || !flags || flags.length === 0) return null;

  // Para cada flag, verificar si ya fue dismissed
  for (const flag of flags) {
    const { data: responses } = await supabase
      .from("psychological_responses")
      .select("id")
      .eq("flag_id", flag.id)
      .not("dismissed_at", "is", null)
      .limit(1);

    // Si no tiene respuesta dismissed, es el flag activo
    if (!responses || responses.length === 0) {
      const message = MESSAGES[flag.flag_type];
      if (!message) continue;

      return {
        id: flag.id,
        flag_type: flag.flag_type,
        detected_at: flag.detected_at,
        message_key: message.key,
        message_content: message.content,
      };
    }
  }

  return null;
}

export function usePsychFlags() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.psychFlags(),
    queryFn: () => fetchActiveFlag(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 30, // 30 minutos (no cambia frecuentemente)
    gcTime: 1000 * 60 * 60,
    // Fallar silenciosamente — si hay error, no mostrar nada
    retry: false,
  });
}
