// Hook para obtener el estado TDEE del usuario desde Supabase
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { TdeeDisplayState } from '@/types/logging'
import type { Database } from '@/types/supabase.generated'

type UserTdeeStateRow = Database['public']['Tables']['user_tdee_state']['Row']

// Determina la etiqueta de confianza según el nivel numérico
function getConfidenceLabel(score: number): string {
  if (score < 0.3) return 'Estimación inicial'
  if (score <= 0.6) return 'Ajustándose a ti'
  return 'Bastante preciso'
}

// Transforma la fila cruda de la BD al tipo de display
function transformRow(row: UserTdeeStateRow): TdeeDisplayState {
  const confidence = row.confidence_level ?? 0
  return {
    goal_kcal: row.current_tdee_kcal ?? 2000,
    confidence_level: confidence,
    confidence_label: getConfidenceLabel(confidence),
    weeks_of_data: row.weeks_of_data ?? 0,
    last_adjusted: row.last_adjusted_at ?? row.updated_at ?? new Date().toISOString(),
    macro_targets: {
      protein_g: 150,
      carbs_g: 250,
      fat_g: 65,
    },
  }
}

async function fetchTdeeState(userId: string): Promise<TdeeDisplayState | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_tdee_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return transformRow(data)
}

export function useTdeeState(userId: string | null) {
  return useQuery({
    queryKey: ['tdeeState', userId],
    queryFn: () => fetchTdeeState(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
