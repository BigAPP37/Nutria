// Hook para obtener el historial de peso del usuario
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { WeightPoint } from '@/types/logging'

async function fetchWeightHistory(userId: string): Promise<WeightPoint[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('weight_entries')
    .select('recorded_at, weight_kg')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: true })
    .limit(90)

  if (error) throw error
  if (!data) return []

  return data as WeightPoint[]
}

export function useWeightHistory(userId: string | null) {
  return useQuery({
    queryKey: ['weightHistory', userId],
    queryFn: () => fetchWeightHistory(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}
