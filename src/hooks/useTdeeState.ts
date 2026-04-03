// Hook para obtener el estado TDEE del usuario desde Supabase
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { TdeeDisplayState } from '@/types/logging'

// Determina la etiqueta de confianza según el nivel numérico
function getConfidenceLabel(score: number): string {
  if (score < 0.3) return 'Estimación inicial'
  if (score <= 0.6) return 'Ajustándose a ti'
  return 'Bastante preciso'
}

// Transforma la fila cruda de la BD al tipo de display
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRow(row: Record<string, any>): TdeeDisplayState {
  const confidence = row.confidence_level ?? 0
  return {
    goal_kcal: row.goal_kcal ?? row.tdee_estimate ?? 2000,
    confidence_level: confidence,
    confidence_label: getConfidenceLabel(confidence),
    weeks_of_data: row.weeks_of_data ?? 0,
    last_adjusted: row.last_adjusted ?? row.updated_at ?? new Date().toISOString(),
    macro_targets: {
      protein_g: row.macro_protein_g ?? row.protein_g ?? 150,
      carbs_g: row.macro_carbs_g ?? row.carbs_g ?? 250,
      fat_g: row.macro_fat_g ?? row.fat_g ?? 65,
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
