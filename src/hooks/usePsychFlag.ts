'use client'

// Hook para obtener el flag psicológico activo más reciente del usuario
// Excluye flags que ya han sido descartados (dismissed_at NOT NULL)

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { PsychFlag } from '@/types/psych'

export function usePsychFlag(userId: string | null) {
  return useQuery<PsychFlag | null>({
    queryKey: ['psychFlag', userId],
    staleTime: 30 * 60 * 1000,
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null

      const supabase = createClient()

      // Fecha de corte: hace 7 días
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoISO = sevenDaysAgo.toISOString()

      // Obtener flags recientes del usuario
      const { data: flags, error: flagsError } = await supabase
        .from('psychological_flags')
        .select('*')
        .eq('user_id', userId)
        .gte('detected_at', sevenDaysAgoISO)
        .order('detected_at', { ascending: false })

      if (flagsError) {
        console.error('Error fetching psychological_flags:', flagsError.message)
        return null
      }

      if (!flags || flags.length === 0) return null

      // Obtener IDs de flags ya descartados por el usuario
      const { data: dismissedResponses, error: responsesError } = await supabase
        .from('psychological_responses')
        .select('flag_id')
        .eq('user_id', userId)
        .not('dismissed_at', 'is', null)

      if (responsesError) {
        console.error('Error fetching psychological_responses:', responsesError.message)
        return null
      }

      const dismissedFlagIds = new Set(
        (dismissedResponses || []).map((r: { flag_id: string }) => r.flag_id)
      )

      // Devolver el primer flag activo (no descartado)
      const activeFlag = (flags as PsychFlag[]).find((f) => !dismissedFlagIds.has(f.id))

      return activeFlag ?? null
    },
  })
}
